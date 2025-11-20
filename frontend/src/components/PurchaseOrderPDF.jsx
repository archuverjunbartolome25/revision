import React, { useRef } from "react";
import html2pdf from "html2pdf.js";

const PurchaseOrder = ({ order }) => {
  const poRef = useRef();

  const generatePDF = () => {
    html2pdf().from(poRef.current).save(`PO_${order?.po_number || "001449"}.pdf`);
  };

  return (
    <div>
      <div ref={poRef} style={{ fontFamily: "DejaVu Sans, sans-serif", fontSize: 12, margin: 20 }}>
        {/* HEADER */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
          <tbody>
            <tr>
              <td style={{ width: "65%", verticalAlign: "top" }}>
                <h2><strong>Balipure Purified Drinking Water</strong></h2>
                <p><strong>BALI CHAMPION BOTTLERS, INC.</strong></p>
                <p>L-21 B-13 Malabanias Road, Josefa Subdivision</p>
                <p>Brgy. Malabanias, Angeles City, Pampanga</p>
                <p>Email: sales.balipure@gmail.com</p>
              </td>
              <td style={{ textAlign: "right", fontWeight: "bold", fontSize: 14 }}>
                {order?.po_number || "001449"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* DATE INFO */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 5, textAlign: "center" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #000", padding: 5, fontSize: 11 }}>DATE PREPARED</th>
              <th style={{ border: "1px solid #000", padding: 5, fontSize: 11 }}>DATE REQUIRED</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #000", padding: 5, fontSize: 11 }}>{order?.order_date}</td>
              <td style={{ border: "1px solid #000", padding: 5, fontSize: 11 }}>{order?.expected_date}</td>
            </tr>
          </tbody>
        </table>

        {/* PURCHASE ORDER TITLE */}
        <div style={{
          fontWeight: "bold",
          textAlign: "center",
          backgroundColor: "#e6f2ff",
          border: "1px solid #000",
          padding: 4,
          marginTop: 15
        }}>PURCHASE ORDER</div>

        {/* SUPPLIER INFO */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <tbody>
            <tr>
              <td><strong>TO:</strong> {order?.supplier_name}</td>
              <td><strong>Contact Person:</strong></td>
            </tr>
            <tr>
              <td><strong>Address:</strong></td>
              <td><strong>Contact #:</strong></td>
            </tr>
            <tr>
              <td><strong>TIN:</strong></td>
              <td><strong>Terms:</strong></td>
            </tr>
          </tbody>
        </table>

        {/* ITEM TABLE */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <thead>
            <tr style={{ backgroundColor: "#d9f2f2" }}>
              <th style={{ border: "1px solid #000", padding: 6 }}>DESCRIPTION / SPECIFICATION</th>
              <th style={{ border: "1px solid #000", padding: 6 }}>UNIT</th>
              <th style={{ border: "1px solid #000", padding: 6 }}>QTY</th>
              <th style={{ border: "1px solid #000", padding: 6 }}>UNIT COST</th>
              <th style={{ border: "1px solid #000", padding: 6 }}>TOTAL AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {order?.items?.length ? order.items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ border: "1px solid #000", padding: 6 }}>{item.item_name || 'Pallet Stretch Film 20u x 500mm x 3kg 3"'}</td>
                <td style={{ border: "1px solid #000", padding: 6 }}>{item.item_type || "Rolls"}</td>
                <td style={{ border: "1px solid #000", padding: 6 }}>{item.quantity || 800}</td>
                <td style={{ border: "1px solid #000", padding: 6 }}>₱{(item.unit_cost || 0).toFixed(2)}</td>
                <td style={{ border: "1px solid #000", padding: 6 }}>₱{(item.total_amount || 0).toFixed(2)}</td>
              </tr>
            )) : null}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4" style={{ textAlign: "right", border: "1px solid #000", padding: 6 }}><strong>TOTAL</strong></td>
              <td style={{ border: "1px solid #000", padding: 6 }}><strong>₱{(order?.amount || 0).toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>

        {/* NOTES */}
        <p style={{ marginTop: 15 }}>FOR CABUYAO PLANT</p>
        <p>REQUESTED BY:</p>

        {/* FOOTER SIGNATURE AREA */}
        <div style={{ fontSize: 11, marginTop: 30, textAlign: "left" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ width: "33%", textAlign: "center" }}>Prepared By:<br /><br />____________________</td>
                <td style={{ width: "33%", textAlign: "center" }}>Noted By:<br /><br />____________________</td>
                <td style={{ width: "33%", textAlign: "center" }}>Approved By:<br /><br />____________________</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <button onClick={generatePDF} style={{ marginTop: 20 }}>Download PDF</button>
    </div>
  );
};

export default PurchaseOrder;
