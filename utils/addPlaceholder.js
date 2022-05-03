const {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFHexString,
  PDFString,
  PDFArray,
  CharCodes,
  PDFImage,
} = require("pdf-lib");

// start addPlaceholder
const _addPlaceholder = async (pdf, image) => {
  const loadedPdf = await PDFDocument.load(pdf);
  const imagepng = await loadedPdf.embedPng(image);
  const pngDims = imagepng.scale(0.5);

  const ByteRange = PDFArrayCustom.withContext(loadedPdf.context);
  const DEFAULT_BYTE_RANGE_PLACEHOLDER = "**********";
  const SIGNATURE_LENGTH = 3322;
  const pages = loadedPdf.getPages();

  ByteRange.push(PDFNumber.of(0));
  ByteRange.push(PDFName.of(DEFAULT_BYTE_RANGE_PLACEHOLDER));
  ByteRange.push(PDFName.of(DEFAULT_BYTE_RANGE_PLACEHOLDER));
  ByteRange.push(PDFName.of(DEFAULT_BYTE_RANGE_PLACEHOLDER));

  const signatureDict = loadedPdf.context.obj({
    Type: "Sig",
    Filter: "Adobe.PPKLite",
    SubFilter: "adbe.pkcs7.detached",
    ByteRange,
    Contents: PDFHexString.of("A".repeat(SIGNATURE_LENGTH)),
    Reason: PDFString.of("We need your signature for reasons..."),
    M: PDFString.fromDate(new Date()),
  });

  const signatureDictRef = loadedPdf.context.register(signatureDict);

  const widgetDict = loadedPdf.context.obj({
    Type: "Annot",
    Subtype: "Widget",
    FT: "Sig",
    Rect: [0,0,0,0], // Signature rect size
    V: signatureDictRef,
    T: PDFString.of("test signature"),
    F: 4,
    P: pages[0].ref,
  });

  const widgetDictRef = loadedPdf.context.register(widgetDict);

  // Add signature widget to the first page
  pages[0].node.set(
    PDFName.of("Annots"),
    loadedPdf.context.obj([widgetDictRef])
  );
  pages[0].drawImage(imagepng, {
    x:386.1023531197302,
    y:509.3047619047619,
    width: pngDims.width,
  });
  pages[1].drawImage(imagepng, {
    x:71.04333119730184,
    y: 529.3523809523809,
    width: pngDims.width
  });
  //pages[0].drawText('I love you', { x: 50, y: 180, size: 28 })
  loadedPdf.catalog.set(
    PDFName.of("AcroForm"),
    loadedPdf.context.obj({
      SigFlags: 3,
      Fields: [widgetDictRef],
    })
  );

  // Allows signatures on newer PDFs
  // @see https://github.com/Hopding/pdf-lib/issues/541
  const pdfBytes = await loadedPdf.save({ useObjectStreams: false });

  return unit8ToBuffer(pdfBytes);
};

/**
 * @param {Uint8Array} unit8
 */
function unit8ToBuffer(unit8) {
  let buf = Buffer.alloc(unit8.byteLength);
  const view = new Uint8Array(unit8);

  for (let i = 0; i < buf.length; ++i) {
    buf[i] = view[i];
  }
  return buf;
}
//   end of addPlaceholder

// start PDFArrayCustom
class PDFArrayCustom extends PDFArray {
  static withContext(context) {
    return new PDFArrayCustom(context);
  }

  clone(context) {
    const clone = PDFArrayCustom.withContext(context || this.context);
    for (let idx = 0, len = this.size(); idx < len; idx++) {
      clone.push(this.array[idx]);
    }
    return clone;
  }

  toString() {
    let arrayString = "[";
    for (let idx = 0, len = this.size(); idx < len; idx++) {
      arrayString += this.get(idx).toString();
      if (idx < len - 1) arrayString += " ";
    }
    arrayString += "]";
    return arrayString;
  }

  sizeInBytes() {
    let size = 2;
    for (let idx = 0, len = this.size(); idx < len; idx++) {
      size += this.get(idx).sizeInBytes();
      if (idx < len - 1) size += 1;
    }
    return size;
  }

  copyBytesInto(buffer, offset) {
    const initialOffset = offset;

    buffer[offset++] = CharCodes.LeftSquareBracket;
    for (let idx = 0, len = this.size(); idx < len; idx++) {
      offset += this.get(idx).copyBytesInto(buffer, offset);
      if (idx < len - 1) buffer[offset++] = CharCodes.Space;
    }
    buffer[offset++] = CharCodes.RightSquareBracket;

    return offset - initialOffset;
  }
}

module.exports = _addPlaceholder;
