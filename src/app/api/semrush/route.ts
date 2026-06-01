export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const BASE = 'https://api.semrush.com/'

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const sep = lines[0].includes(';') ? ';' : '|'
  const headers = lines[0].split(sep).map(h => h.trim())
  return lines.slice(1).map(line => {
    const vals = line.split(sep)
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim()]))
  })
}

function isError(text: string) {
  return text.trim().startsWith('ERROR')
}

async function semFetch(params: Record<string, string>): Promise<string> {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE}?${qs}`)
  return res.text()
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const apiKey   = searchParams.get('apiKey')
  const domain   = searchParams.get('domain')
  const database = searchParams.get('database') || 'us'

  if (!apiKey || !domain) {
    return NextResponse.json({ error: 'apiKey and domain are required' }, { status: 400 })
  }

  const cleanDomain = domain
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/.*$/, '')
    .toLowerCase()

  try {
    const [overviewText, keywordsText, competitorsText, backlinksText] = await Promise.all([
      semFetch({ type: 'domain_rank', key: apiKey, domain: cleanDomain, database, export_columns: 'Dn,Or,Ot,Oc,Ad,At,Ac' }),
      semFetch({ type: 'domain_organic', key: apiKey, domain: cleanDomain, database, display_limit: '25', display_sort: 'po_asc', export_columns: 'Ph,Po,Pp,Nq,Cp,Ur,Tr,Kd' }),
      semFetch({ type: 'domain_organic_organic', key: apiKey, domain: cleanDomain, database, display_limit: '10', export_columns: 'Dn,Cr,Or,Ot' }),
      semFetch({ type: 'backlinks_overview', key: apiKey, target: cleanDomain, target_type: 'root_domain', export_columns: 'target,ascore,total,domains_num,urls_num,follows_num,nofollows_num' }),
    ])

    // Surface any API key / permission errors
    for (const [label, text] of [['overview', overviewText], ['keywords', keywordsText]]) {
      if (isError(text)) {
        const code = text.match(/ERROR (\d+)/)?.[1]
        const msg  = text.match(/:: (.+)/)?.[1] || text.trim()
        return NextResponse.json(
          { error: `SEMrush API error (${label}): ${msg}`, code },
          { status: 400 }
        )
      }
    }

    const overviewRow  = parseCsv(overviewText)[0]  || {}
    const keywords     = parseCsv(keywordsText)
    const competitors  = isError(competitorsText) ? [] : parseCsv(competitorsText)
    const backlinksRow = isError(backlinksText)   ? {} : (parseCsv(backlinksText)[0] || {})

    return NextResponse.json({
      domain: cleanDomain,
      database,
      overview: {
        organicKeywords: parseInt(overviewRow.Or  || overviewRow['Organic Keywords'] || '0') || 0,
        organicTraffic:  parseInt(overviewRow.Ot  || overviewRow['Organic Traffic']  || '0') || 0,
        organicCost:     parseFloat(overviewRow.Oc || overviewRow['Organic Cost']    || '0') || 0,
        paidKeywords:    parseInt(overviewRow.Ad  || '0') || 0,
        paidTraffic:     parseInt(overviewRow.At  || '0') || 0,
      },
      keywords: keywords.map(k => ({
        keyword:      k.Ph || k.Keyword || '',
        position:     parseInt(k.Po || k.Position || '0') || 0,
        prevPosition: parseInt(k.Pp || '0') || 0,
        volume:       parseInt(k.Nq || k['Search Volume'] || '0') || 0,
        cpc:          parseFloat(k.Cp || k.CPC || '0') || 0,
        url:          k.Ur || k.URL || '',
        traffic:      parseInt(k.Tr || k.Traffic || '0') || 0,
        difficulty:   parseInt(k.Kd || '0') || 0,
      })),
      competitors: competitors.map(c => ({
        domain:          c.Dn || '',
        commonKeywords:  parseInt(c.Cr || '0') || 0,
        organicKeywords: parseInt(c.Or || '0') || 0,
        organicTraffic:  parseInt(c.Ot || '0') || 0,
      })),
      backlinks: {
        total:    parseInt(backlinksRow.total    || '0') || 0,
        domains:  parseInt(backlinksRow.domains_num || '0') || 0,
        follows:  parseInt(backlinksRow.follows_num  || '0') || 0,
        nofollow: parseInt(backlinksRow.nofollows_num || '0') || 0,
        ascore:   parseInt(backlinksRow.ascore   || '0') || 0,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
