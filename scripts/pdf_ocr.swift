import AppKit
import Foundation
import PDFKit
import Vision

struct OCRResult: Encodable {
  let text: String
  let pageCount: Int
}

func renderPage(_ page: PDFPage) -> CGImage? {
  let bounds = page.bounds(for: .mediaBox)
  let scale: CGFloat = 2.0
  let scaledSize = NSSize(width: max(bounds.width * scale, 1), height: max(bounds.height * scale, 1))
  let image = NSImage(size: scaledSize)

  image.lockFocus()
  defer { image.unlockFocus() }

  NSColor.white.setFill()
  NSBezierPath(rect: NSRect(origin: .zero, size: scaledSize)).fill()

  guard let context = NSGraphicsContext.current?.cgContext else {
    return nil
  }

  context.saveGState()
  context.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: context)
  context.restoreGState()

  let rect = NSRect(origin: .zero, size: scaledSize)
  return image.cgImage(forProposedRect: nil, context: nil, hints: nil) ?? NSBitmapImageRep(focusedViewRect: rect)?.cgImage
}

func recognizeText(from image: CGImage) throws -> String {
  let request = VNRecognizeTextRequest()
  request.recognitionLevel = .accurate
  request.usesLanguageCorrection = true
  request.recognitionLanguages = ["en-US", "tr-TR"]

  let handler = VNImageRequestHandler(cgImage: image, options: [:])
  try handler.perform([request])

  let observations = request.results ?? []
  return observations.compactMap { $0.topCandidates(1).first?.string }.joined(separator: "\n")
}

guard CommandLine.arguments.count >= 2 else {
  fputs("Missing PDF path\n", stderr)
  exit(1)
}

let pdfPath = CommandLine.arguments[1]
let fileURL = URL(fileURLWithPath: pdfPath)

guard let document = PDFDocument(url: fileURL) else {
  fputs("Unable to open PDF\n", stderr)
  exit(1)
}

var pageTexts: [String] = []

for pageIndex in 0..<document.pageCount {
  guard let page = document.page(at: pageIndex), let image = renderPage(page) else {
    continue
  }

  let recognized = try recognizeText(from: image)
  if !recognized.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
    pageTexts.append(recognized)
  }
}

let result = OCRResult(text: pageTexts.joined(separator: "\n\n"), pageCount: document.pageCount)
let data = try JSONEncoder().encode(result)
FileHandle.standardOutput.write(data)