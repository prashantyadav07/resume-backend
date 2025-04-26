'use strict'

import * as pdfjs from 'pdfjs-dist'

async function getPageText (pageNum, doc) {
  const page = await doc.getPage(pageNum)
  const textContent = await page.getTextContent()
  return textContent.items.reduce((a, v) => a + v.str, '')
}

export async function parsePdf(contentBuffer, { customPdfjs } = {}){
  let pdfjsAPI = pdfjs

  if (customPdfjs) {
    pdfjsAPI = customPdfjs
  }

  return pdfjsAPI.getDocument(new Uint8Array(contentBuffer)).promise.then(async function (doc){
    const result = { pages: [] }

      for (let i = 1; i < doc.numPages + 1; i++) {
        result.pages.push({
          text: await getPageText(i, doc)
        })
      }

      return result
  })
}
