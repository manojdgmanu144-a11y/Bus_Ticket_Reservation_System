// controllers/ticketController.js
// ============================================================
// PDF Ticket Generation using PDFKit
// GET /api/tickets/:booking_id → streams PDF to client
// ============================================================

const db = require('../config/db');
const PDFDocument = require('pdfkit');

const generateTicket = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        b.booking_id, b.seat_number, b.passenger_name, b.passenger_age,
        b.booking_date, b.payment_status,
        u.name AS user_name, u.email AS user_email,
        v.vehicle_name, v.vehicle_type, v.source, v.destination,
        v.departure_time, v.arrival_time, v.date AS travel_date, v.price
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.booking_id = ?`,
      [req.params.booking_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const t = rows[0]; // ticket data

    // Ownership check
    if (req.user.role !== 'admin' && t.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A5' });

    // Set response headers so browser downloads as PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket_${t.booking_id}.pdf`);

    // Pipe PDF to response stream
    doc.pipe(res);

    // ── Header ──────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill('#1a56db');
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
       .text('🎫 TICKET RESERVATION', 50, 25, { align: 'center' });
    doc.fontSize(10).text(`Booking Confirmed`, 50, 52, { align: 'center' });

    // ── Booking ID badge ────────────────────────────────
    doc.fillColor('#1a56db').rect(50, 95, 240, 30).fill();
    doc.fillColor('white').font('Helvetica-Bold').fontSize(11)
       .text(`Booking ID: #${t.booking_id}`, 60, 103);

    // ── Vehicle info ────────────────────────────────────
    doc.fillColor('#111').font('Helvetica-Bold').fontSize(16)
       .text(`${t.vehicle_name}`, 50, 140);
    doc.font('Helvetica').fontSize(11).fillColor('#555')
       .text(`${t.vehicle_type.toUpperCase()} | Seat: ${t.seat_number}`, 50, 162);

    // Divider
    doc.moveTo(50, 185).lineTo(doc.page.width - 50, 185).strokeColor('#ddd').lineWidth(1).stroke();

    // ── Route ───────────────────────────────────────────
    doc.fillColor('#111').font('Helvetica-Bold').fontSize(13)
       .text(t.source, 50, 200);
    doc.font('Helvetica').fillColor('#555').fontSize(10)
       .text(new Date(`2000-01-01T${t.departure_time}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), 50, 218);

    doc.fillColor('#1a56db').fontSize(18).text('→', 160, 205);

    doc.fillColor('#111').font('Helvetica-Bold').fontSize(13)
       .text(t.destination, 200, 200);
    doc.font('Helvetica').fillColor('#555').fontSize(10)
       .text(new Date(`2000-01-01T${t.arrival_time}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), 200, 218);

    // ── Details table ───────────────────────────────────
    const labelX = 50, valueX = 200;
    let y = 255;
    const rows2 = [
      ['Passenger Name', t.passenger_name],
      ['Passenger Age',  `${t.passenger_age} years`],
      ['Travel Date',    new Date(t.travel_date).toDateString()],
      ['Seat Number',    t.seat_number],
      ['Booked By',      t.user_name],
      ['Payment Status', t.payment_status.toUpperCase()],
      ['Amount Paid',    `₹ ${parseFloat(t.price).toFixed(2)}`],
    ];

    rows2.forEach(([label, value]) => {
      doc.fillColor('#888').font('Helvetica').fontSize(9).text(label, labelX, y);
      doc.fillColor('#111').font('Helvetica-Bold').fontSize(10).text(value, valueX, y);
      y += 22;
    });

    // ── Footer ──────────────────────────────────────────
    doc.moveTo(50, y + 10).lineTo(doc.page.width - 50, y + 10).strokeColor('#ddd').stroke();
    doc.fillColor('#888').font('Helvetica').fontSize(8)
       .text('Thank you for booking with us! Have a safe journey.', 50, y + 20, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 50, y + 34, { align: 'center' });

    doc.end(); // Finalize the PDF

  } catch (err) {
    console.error('Ticket generation error:', err);
    res.status(500).json({ message: 'Failed to generate ticket.' });
  }
};

module.exports = { generateTicket };
