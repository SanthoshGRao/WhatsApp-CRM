const fs = require('fs');

async function test() {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  doc.text("UPI/DR/608711149395 1.00", 10, 10);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  const file = new Blob([pdfBuffer], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append("file", file, "test.pdf");

  const res = await fetch("http://localhost:3000/api/admin/reconcile-statement", {
    method: "POST",
    body: formData,
  });
  
  if (!res.ok) {
     const text = await res.text();
     console.log("STATUS:", res.status);
     console.log("RESPONSE:", text.substring(0, 500));
  } else {
     console.log(await res.json());
  }
}
test();
