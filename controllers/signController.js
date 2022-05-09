const { PDFDocument, PDFName, PDFNumber, PDFHexString, PDFString, PDFArray, CharCodes } = require('pdf-lib')
const signer = require('node-signpdf');
const filePdfPath = './resources/SignDocument.pdf';
const certfPath = './resources/certificate.p12';
const imagePath = './resources/SamSign_image.png';
const fs = require('fs');
const _addPlaceholder = require('../utils/addPlaceholder')
const pdf2base64 = require("pdf-to-base64");

exports.signWithPdfLib = async (req, res) => {
    // read the document and certificate
    const pdf = fs.readFileSync(filePdfPath);
    const certf = fs.readFileSync(certfPath);
    const image = fs.readFileSync(imagePath);

    // add placeholder
    const pdfWithPlaceholder = await _addPlaceholder(pdf,image)
    // sign the doc
    const signedPdf = signer.default.sign(pdfWithPlaceholder,certf)
    // generate name
    const randomNumber = Math.floor(Math.random()*5000);
    const pdfName = `./signedfiles/Signed_Document${randomNumber}.pdf`;
    // write the new document
    fs.writeFileSync(pdfName,signedPdf)
    // render new page
    console.log(`success signing ${pdfName}`)
    pdf2base64(pdfName)
    .then((response) => {
      res.status(200).send(response);
    })
    .catch((error) => {
      console.log(error); //Exepection error....
    });
}
    // end of PDFArrayCustom