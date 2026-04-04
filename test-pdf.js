const fs = require('fs');

async function test() {
  try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.text("UPI/DR/608711149395 1.00", 10, 10);
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

      const { PDFParse } = require("pdf-parse");
      const parser = new PDFParse({ data: pdfBuffer });
      const pdfData = await parser.getText();
      console.log(pdfData.text);
      await parser.destroy();
  } catch(e) {
      console.log("ERROR", e);
  }
}
test();
