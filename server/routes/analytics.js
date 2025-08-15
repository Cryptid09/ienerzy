const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { pool } = require('../database/setup');

// GET /api/v1/analytics/dealer-dashboard - Dealer KPIs
router.get('/dealer-dashboard', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get dealer-specific data
    let whereClause = '';
    let params = [];
    
    if (req.user.role === 'dealer') {
      whereClause = 'WHERE c.dealer_id = $1';
      params = [userId];
    }
    
    // Consumer count
    const consumerQuery = `
      SELECT COUNT(*) as total_consumers,
             COUNT(CASE WHEN kyc_status = 'verified' THEN 1 END) as verified_consumers,
             COUNT(CASE WHEN kyc_status = 'pending' THEN 1 END) as pending_consumers
      FROM consumers c
      ${whereClause}
    `;
    
    const consumerResult = await pool.query(consumerQuery, params);
    
    // Battery count
    const batteryQuery = `
      SELECT COUNT(*) as total_batteries,
             COUNT(CASE WHEN b.status = 'active' THEN 1 END) as active_batteries,
             COUNT(CASE WHEN b.status = 'maintenance' THEN 1 END) as maintenance_batteries,
             AVG(b.health_score) as avg_health_score
      FROM batteries b
      JOIN consumers c ON b.owner_id = c.id
      ${whereClause}
    `;
    
    const batteryResult = await pool.query(batteryQuery, params);
    
    // Finance applications
    const financeQuery = `
      SELECT COUNT(*) as total_applications,
             COUNT(CASE WHEN na.status = 'approved' THEN 1 END) as approved_applications,
             COUNT(CASE WHEN na.status = 'disbursed' THEN 1 END) as disbursed_applications,
             SUM(CASE WHEN na.status = 'disbursed' THEN na.disbursed_amount ELSE 0 END) as total_disbursed
      FROM nbfc_applications na
      JOIN consumers c ON na.consumer_id = c.id
      ${whereClause}
    `;
    
    const financeResult = await pool.query(financeQuery, params);
    
    // Service tickets
    const serviceQuery = `
      SELECT COUNT(*) as total_tickets,
             COUNT(CASE WHEN st.status = 'open' THEN 1 END) as open_tickets,
             COUNT(CASE WHEN st.status = 'in_progress' THEN 1 END) as in_progress_tickets,
             COUNT(CASE WHEN st.status = 'resolved' THEN 1 END) as resolved_tickets
      FROM service_tickets st
      JOIN batteries b ON st.battery_id = b.id
      JOIN consumers c ON b.owner_id = c.id
      ${whereClause}
    `;
    
    const serviceResult = await pool.query(serviceQuery, params);
    
    // Monthly trends (last 6 months)
    const trendsQuery = `
      SELECT 
        DATE_TRUNC('month', c.created_at) as month,
        COUNT(DISTINCT c.id) as new_consumers,
        COUNT(DISTINCT b.id) as new_batteries
      FROM consumers c
      LEFT JOIN batteries b ON b.owner_id = c.id
      ${whereClause}
      GROUP BY DATE_TRUNC('month', c.created_at)
      ORDER BY month DESC
      LIMIT 6
    `;
    
    const trendsResult = await pool.query(trendsQuery, params);
    
    res.json({
      success: true,
      dashboard: {
        consumers: consumerResult.rows[0],
        batteries: batteryResult.rows[0],
        finance: financeResult.rows[0],
        service: serviceResult.rows[0],
        trends: trendsResult.rows
      }
    });
  } catch (error) {
    console.error('Dealer dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/analytics/nbfc-portfolio - NBFC portfolio metrics
router.get('/nbfc-portfolio', authenticateToken, requireRole(['nbfc', 'admin']), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE na.submitted_at BETWEEN $1 AND $2';
      params = [start_date, end_date];
    }
    
    // Portfolio overview
    const portfolioQuery = `
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN na.status = 'submitted' THEN 1 END) as pending_review,
        COUNT(CASE WHEN na.status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN na.status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN na.status = 'disbursed' THEN 1 END) as disbursed,
        SUM(CASE WHEN na.status = 'disbursed' THEN na.disbursed_amount ELSE 0 END) as total_disbursed,
        AVG(CASE WHEN na.status = 'disbursed' THEN na.tenure_months ELSE NULL END) as avg_tenure,
        AVG(CASE WHEN na.status = 'disbursed' THEN na.interest_rate ELSE NULL END) as avg_interest_rate
      FROM nbfc_applications na
      ${dateFilter}
    `;
    
    const portfolioResult = await pool.query(portfolioQuery, params);
    
    // Risk analysis
    const riskQuery = `
      SELECT 
        COUNT(*) as total_active_loans,
        COUNT(CASE WHEN overdue_count > 0 THEN 1 END) as loans_with_overdue,
        AVG(overdue_count) as avg_overdue_per_loan,
        SUM(overdue_amount) as total_overdue_amount
      FROM (
        SELECT 
          na.id,
          COUNT(CASE WHEN es.status = 'pending' AND es.due_date < NOW() THEN 1 END) as overdue_count,
          SUM(CASE WHEN es.status = 'pending' AND es.due_date < NOW() THEN es.amount ELSE 0 END) as overdue_amount
        FROM nbfc_applications na
        JOIN emi_schedules es ON na.id = es.application_id
        WHERE na.status = 'disbursed'
        GROUP BY na.id
      ) risk_data
    `;
    
    const riskResult = await pool.query(riskQuery);
    
    // Collection efficiency
    const collectionQuery = `
      SELECT 
        DATE_TRUNC('month', es.due_date) as month,
        COUNT(*) as total_emis,
        COUNT(CASE WHEN es.status = 'paid' THEN 1 END) as paid_emis,
        SUM(CASE WHEN es.status = 'paid' THEN es.payment_amount ELSE 0 END) as collected_amount,
        ROUND(
          (COUNT(CASE WHEN es.status = 'paid' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
        ) as collection_rate
      FROM emi_schedules es
      JOIN nbfc_applications na ON es.application_id = na.id
      WHERE na.status = 'disbursed'
      GROUP BY DATE_TRUNC('month', es.due_date)
      ORDER BY month DESC
      LIMIT 12
    `;
    
    const collectionResult = await pool.query(collectionQuery);
    
    res.json({
      success: true,
      portfolio: portfolioResult.rows[0],
      risk_analysis: riskResult.rows[0],
      collection_efficiency: collectionResult.rows
    });
  } catch (error) {
    console.error('NBFC portfolio analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/analytics/collection-report - Collection analytics
router.get('/collection-report', authenticateToken, requireRole(['nbfc', 'admin']), async (req, res) => {
  try {
    const { start_date, end_date, dealer_id } = req.query;
    
    let whereClause = 'WHERE na.status = \'disbursed\'';
    let params = [];
    let paramCount = 0;
    
    if (start_date && end_date) {
      paramCount += 2;
      whereClause += ` AND es.due_date BETWEEN $${paramCount - 1} AND $${paramCount}`;
      params.push(start_date, end_date);
    }
    
    if (dealer_id) {
      paramCount += 1;
      whereClause += ` AND na.dealer_id = $${paramCount}`;
      params.push(dealer_id);
    }
    
    const collectionQuery = `
      SELECT 
        na.loan_account_number,
        c.name as consumer_name,
        c.phone as consumer_phone,
        u.name as dealer_name,
        na.disbursed_amount,
        na.tenure_months,
        COUNT(es.id) as total_emis,
        COUNT(CASE WHEN es.status = 'paid' THEN 1 END) as paid_emis,
        COUNT(CASE WHEN es.status = 'pending' THEN 1 END) as pending_emis,
        COUNT(CASE WHEN es.status = 'pending' AND es.due_date < NOW() THEN 1 END) as overdue_emis,
        SUM(CASE WHEN es.status = 'paid' THEN es.payment_amount ELSE 0 END) as collected_amount,
        SUM(CASE WHEN es.status = 'pending' THEN es.amount ELSE 0 END) as outstanding_amount,
        MAX(CASE WHEN es.status = 'paid' THEN es.payment_date END) as last_payment_date
      FROM nbfc_applications na
      JOIN consumers c ON na.consumer_id = c.id
      JOIN users u ON na.dealer_id = u.id
      JOIN emi_schedules es ON na.id = es.application_id
      ${whereClause}
      GROUP BY na.id, na.loan_account_number, c.name, c.phone, u.name, na.disbursed_amount, na.tenure_months
      ORDER BY outstanding_amount DESC
    `;
    
    const collectionResult = await pool.query(collectionQuery, params);
    
    // Summary statistics
    const summary = {
      total_loans: collectionResult.rows.length,
      total_disbursed: collectionResult.rows.reduce((sum, row) => sum + parseFloat(row.disbursed_amount), 0),
      total_collected: collectionResult.rows.reduce((sum, row) => sum + parseFloat(row.collected_amount), 0),
      total_outstanding: collectionResult.rows.reduce((sum, row) => sum + parseFloat(row.outstanding_amount), 0),
      avg_collection_rate: collectionResult.rows.length > 0 ? 
        (collectionResult.rows.reduce((sum, row) => sum + (row.paid_emis / row.total_emis), 0) / collectionResult.rows.length * 100).toFixed(2) : 0
    };
    
    res.json({
      success: true,
      summary,
      details: collectionResult.rows
    });
  } catch (error) {
    console.error('Collection analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/analytics/battery-health - Fleet health metrics
router.get('/battery-health', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const userId = req.user.userId;
    
    let whereClause = '';
    let params = [];
    
    if (req.user.role === 'dealer') {
      whereClause = 'WHERE c.dealer_id = $1';
      params = [userId];
    }
    
    // Health distribution
    const healthQuery = `
      SELECT 
        CASE 
          WHEN b.health_score >= 90 THEN 'Excellent (90-100)'
          WHEN b.health_score >= 80 THEN 'Good (80-89)'
          WHEN b.health_score >= 70 THEN 'Fair (70-79)'
          WHEN b.health_score >= 60 THEN 'Poor (60-69)'
          ELSE 'Critical (<60)'
        END as health_category,
        COUNT(*) as battery_count,
        AVG(b.health_score) as avg_health
      FROM batteries b
      JOIN consumers c ON b.owner_id = c.id
      ${whereClause}
      GROUP BY health_category
      ORDER BY avg_health DESC
    `;
    
    const healthResult = await pool.query(healthQuery, params);
    
    // Status distribution
    const statusQuery = `
      SELECT 
        b.status,
        COUNT(*) as count,
        AVG(b.health_score) as avg_health
      FROM batteries b
      JOIN consumers c ON b.owner_id = c.id
      ${whereClause}
      GROUP BY b.status
      ORDER BY count DESC
    `;
    
    const statusResult = await pool.query(statusQuery, params);
    
    // Age analysis
    const ageQuery = `
      SELECT 
        CASE 
          WHEN EXTRACT(DAYS FROM NOW() - b.created_at) <= 30 THEN 'New (0-30 days)'
          WHEN EXTRACT(DAYS FROM NOW() - b.created_at) <= 90 THEN 'Recent (31-90 days)'
          WHEN EXTRACT(DAYS FROM NOW() - b.created_at) <= 365 THEN 'Mature (91-365 days)'
          ELSE 'Old (>1 year)'
        END as age_category,
        COUNT(*) as battery_count,
        AVG(b.health_score) as avg_health
      FROM batteries b
      JOIN consumers c ON b.owner_id = c.id
      ${whereClause}
      GROUP BY age_category
      ORDER BY avg_health DESC
    `;
    
    const ageResult = await pool.query(ageQuery, params);
    
    // Maintenance alerts
    const maintenanceQuery = `
      SELECT 
        b.serial_number,
        c.name as consumer_name,
        b.health_score,
        b.status,
        b.created_at,
        CASE 
          WHEN b.health_score < 60 THEN 'Critical - Immediate attention required'
          WHEN b.health_score < 70 THEN 'Poor - Schedule maintenance soon'
          WHEN b.health_score < 80 THEN 'Fair - Monitor closely'
          ELSE 'Good - Normal operation'
        END as alert_level
      FROM batteries b
      JOIN consumers c ON b.owner_id = c.id
      ${whereClause}
      WHERE b.health_score < 80 OR b.status = 'maintenance'
      ORDER BY b.health_score ASC
      LIMIT 20
    `;
    
    const maintenanceResult = await pool.query(maintenanceQuery, params);
    
    res.json({
      success: true,
      health_distribution: healthResult.rows,
      status_distribution: statusResult.rows,
      age_analysis: ageResult.rows,
      maintenance_alerts: maintenanceResult.rows
    });
  } catch (error) {
    console.error('Battery health analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/analytics/service-metrics - Service performance metrics
router.get('/service-metrics', authenticateToken, requireRole(['dealer', 'admin']), async (req, res) => {
  try {
    const userId = req.user.userId;
    
    let whereClause = '';
    let params = [];
    
    if (req.user.role === 'dealer') {
      whereClause = 'WHERE c.dealer_id = $1';
      params = [userId];
    }
    
    // Service ticket metrics
    const ticketQuery = `
      SELECT 
        st.status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (st.resolved_at - st.created_at))/3600) as avg_resolution_hours
      FROM service_tickets st
      JOIN batteries b ON st.battery_id = b.id
      JOIN consumers c ON b.owner_id = c.id
      ${whereClause}
      GROUP BY st.status
      ORDER BY count DESC
    `;
    
    const ticketResult = await pool.query(ticketQuery, params);
    
    // Resolution time analysis
    const resolutionQuery = `
      SELECT 
        CASE 
          WHEN resolution_hours <= 2 THEN 'Quick (0-2 hours)'
          WHEN resolution_hours <= 8 THEN 'Fast (2-8 hours)'
          WHEN resolution_hours <= 24 THEN 'Normal (8-24 hours)'
          WHEN resolution_hours <= 72 THEN 'Slow (1-3 days)'
          ELSE 'Very Slow (>3 days)'
        END as resolution_category,
        COUNT(*) as ticket_count,
        AVG(resolution_hours) as avg_hours
      FROM (
        SELECT 
          st.id,
          EXTRACT(EPOCH FROM (st.resolved_at - st.created_at))/3600 as resolution_hours
        FROM service_tickets st
        JOIN batteries b ON st.battery_id = b.id
        JOIN consumers c ON b.owner_id = c.id
        WHERE st.status = 'resolved' AND st.resolved_at IS NOT NULL
        ${whereClause.replace('WHERE', 'AND')}
      ) resolution_data
      GROUP BY resolution_category
      ORDER BY avg_hours ASC
    `;
    
    const resolutionResult = await pool.query(resolutionQuery, params);
    
    // Monthly trends
    const trendsQuery = `
      SELECT 
        DATE_TRUNC('month', st.created_at) as month,
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN st.status = 'resolved' THEN 1 END) as resolved_tickets,
        AVG(EXTRACT(EPOCH FROM (st.resolved_at - st.created_at))/3600) as avg_resolution_hours
      FROM service_tickets st
      JOIN batteries b ON st.battery_id = b.id
      JOIN consumers c ON b.owner_id = c.id
      ${whereClause}
      GROUP BY DATE_TRUNC('month', st.created_at)
      ORDER BY month DESC
      LIMIT 12
    `;
    
    const trendsResult = await pool.query(trendsQuery, params);
    
    // Technician performance
    const technicianQuery = `
      SELECT 
        u.name as technician_name,
        COUNT(st.id) as assigned_tickets,
        COUNT(CASE WHEN st.status = 'resolved' THEN 1 END) as resolved_tickets,
        AVG(EXTRACT(EPOCH FROM (st.resolved_at - st.created_at))/3600) as avg_resolution_hours
      FROM service_tickets st
      JOIN users u ON st.assigned_to = u.id
      JOIN batteries b ON st.battery_id = b.id
      JOIN consumers c ON b.owner_id = c.id
      WHERE st.assigned_to IS NOT NULL
      ${whereClause.replace('WHERE', 'AND')}
      GROUP BY u.id, u.name
      ORDER BY resolved_tickets DESC
      LIMIT 10
    `;
    
    const technicianResult = await pool.query(technicianQuery, params);
    
    res.json({
      success: true,
      ticket_metrics: ticketResult.rows,
      resolution_analysis: resolutionResult.rows,
      monthly_trends: trendsResult.rows,
      technician_performance: technicianResult.rows
    });
  } catch (error) {
    console.error('Service metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 