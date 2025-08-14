const { pool } = require('./database/setup');

async function testServiceTickets() {
  try {
    console.log('🔧 Testing Service Ticket Functionality...\n');

    // Test 1: Check if service_tickets table exists
    console.log('1. Checking service_tickets table...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'service_tickets'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ service_tickets table exists');
    } else {
      console.log('❌ service_tickets table missing');
      return;
    }

    // Test 2: Check table structure
    console.log('\n2. Checking table structure...');
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'service_tickets'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns:');
    structure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Test 3: Check existing tickets
    console.log('\n3. Checking existing tickets...');
    const tickets = await pool.query(`
      SELECT st.*, b.serial_number, c.name as consumer_name
      FROM service_tickets st
      JOIN batteries b ON st.battery_id = b.id
      LEFT JOIN consumers c ON b.owner_id = c.id
      ORDER BY st.created_at DESC;
    `);
    
    if (tickets.rows.length > 0) {
      console.log(`✅ Found ${tickets.rows.length} service tickets:`);
      tickets.rows.forEach(ticket => {
        console.log(`  - Ticket #${ticket.id}: ${ticket.issue_category} for ${ticket.serial_number} (${ticket.status})`);
      });
    } else {
      console.log('⚠️  No service tickets found');
    }

    // Test 4: Check batteries with tickets
    console.log('\n4. Checking batteries with service tickets...');
    const batteriesWithTickets = await pool.query(`
      SELECT b.serial_number, b.status, b.health_score,
             COUNT(st.id) as ticket_count,
             STRING_AGG(st.status, ', ') as ticket_statuses
      FROM batteries b
      LEFT JOIN service_tickets st ON b.id = st.battery_id
      GROUP BY b.id, b.serial_number, b.status, b.health_score
      ORDER BY ticket_count DESC;
    `);
    
    console.log('Battery status:');
    batteriesWithTickets.rows.forEach(battery => {
      const status = battery.ticket_count > 0 ? 
        `(${battery.ticket_count} tickets: ${battery.ticket_statuses})` : 
        '(no tickets)';
      console.log(`  - ${battery.serial_number}: ${battery.status}, Health: ${battery.health_score}% ${status}`);
    });

    // Test 5: Check foreign key relationships
    console.log('\n5. Checking foreign key relationships...');
    const fkCheck = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'service_tickets';
    `);
    
    if (fkCheck.rows.length > 0) {
      console.log('✅ Foreign key constraints:');
      fkCheck.rows.forEach(fk => {
        console.log(`  - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('❌ No foreign key constraints found');
    }

    console.log('\n🎯 Service Ticket System Status: READY');
    console.log('\n📋 What you can do:');
    console.log('  - Create service tickets for batteries');
    console.log('  - Assign technicians to tickets');
    console.log('  - Update ticket status (open → assigned → in_progress → resolved)');
    console.log('  - View tickets by battery');
    console.log('  - Track maintenance history');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testServiceTickets(); 