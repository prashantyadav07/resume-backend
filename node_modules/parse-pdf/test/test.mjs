'use strict'

import path from 'path'
import fs from 'fs'
import should from 'should'
import { parsePdf } from '../index.mjs'

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const invoicePdfPath = path.join(__dirname, 'Invoice.pdf')

describe('parse-pdf', () => {
  it('should parse pdf', async () => {
    const f = fs.readFileSync(invoicePdfPath)
    const parsed = await parsePdf(f)

    should(parsed.pages[0].text).containEql('Invoice #: 123')
    should(parsed.pages[0].text).containEql('Total: $300')
  })
})
