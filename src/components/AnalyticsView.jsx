import { STATUS } from '../constants'
import { statusCounts, getResponseRate, getSectorBreakdown } from '../utils/jobUtils'

export default function AnalyticsView({ jobs }) {
  const counts = statusCounts(jobs)
  const responseRate = getResponseRate(jobs)
  const sectors = getSectorBreakdown(jobs)
  const total = jobs.length || 1

  const applied = jobs.filter(j => ['Applied','Interview','Offer','Rejected','Withdrawn'].includes(j.status)).length
  const interviews = counts['Interview'] || 0
  const offers = counts['Offer'] || 0
  const conversionToInterview = applied ? Math.round((interviews / applied) * 100) : 0
  const conversionToOffer = interviews ? Math.round((offers / interviews) * 100) : 0

  const companies = [...new Set(jobs.map(j => j.company))].slice(0, 12)

  const salaryGroups = { '40–60 LPA': 0, '60–90 LPA': 0, '90–120 LPA': 0, '120LPA+': 0 }
  jobs.forEach(j => {
    const s = j.salary_band || ''
    if (s.includes('120') || parseInt(s) >= 120) salaryGroups['120LPA+']++
    else if (s.includes('90') || parseInt(s) >= 90) salaryGroups['90–120 LPA']++
    else if (s.includes('60') || parseInt(s) >= 60) salaryGroups['60–90 LPA']++
    else salaryGroups['40–60 LPA']++
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

      {/* Pipeline health */}
      <Card title="Pipeline_Status">
        {Object.entries(STATUS).map(([s, cfg]) => (
          <div key={s} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s}</span>
              <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: cfg.color }}>{counts[s] || 0}</span>
            </div>
            <div style={{ height: 3, background: 'var(--border)' }}>
              <div style={{ height: '100%', width: `${((counts[s] || 0) / total) * 100}%`, background: cfg.color, transition: 'width 0.5s' }} />
            </div>
          </div>
        ))}
      </Card>

      {/* Funnel */}
      <Card title="Conversion_Funnel">
        {[
          { label: 'Saved',      value: counts['Saved'] || 0, color: '#71717a' },
          { label: 'Applied',    value: applied,              color: 'var(--blue)' },
          { label: 'Interviews', value: interviews,           color: 'var(--amber)' },
          { label: 'Offers',     value: offers,               color: 'var(--green)' },
        ].map((item, i, arr) => (
          <div key={item.label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</span>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.value}</span>
            </div>
            <div style={{ height: 6, background: 'var(--border)' }}>
              <div style={{
                height: '100%',
                width: `${arr[0].value ? (item.value / arr[0].value) * 100 : 0}%`,
                background: item.color, transition: 'width 0.5s',
              }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 10, padding: '10px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
            Response rate: <span style={{ color: 'var(--amber)' }}>{responseRate}%</span>
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
            Applied → Interview: <span style={{ color: 'var(--blue)' }}>{conversionToInterview}%</span>
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
            Interview → Offer: <span style={{ color: 'var(--green)' }}>{conversionToOffer}%</span>
          </div>
        </div>
      </Card>

      {/* Sectors */}
      <Card title="Sectors_Targeted">
        {sectors.length === 0 && <Muted>no tag data yet</Muted>}
        {sectors.slice(0, 10).map(([tag, count]) => (
          <div key={tag} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tag}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--blue)' }}>{count}</span>
            </div>
            <div style={{ height: 3, background: 'var(--border)' }}>
              <div style={{ height: '100%', width: `${(count / (sectors[0]?.[1] || 1)) * 100}%`, background: 'var(--blue)' }} />
            </div>
          </div>
        ))}
      </Card>

      {/* Company tracker */}
      <Card title="Company_Tracker" style={{ gridColumn: '1 / 3' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {companies.map(company => {
            const compJobs = jobs.filter(j => j.company === company)
            const topStatus = compJobs.sort((a, b) => {
              const order = ['Offer','Interview','Applied','Saved','Rejected','Withdrawn']
              return order.indexOf(a.status) - order.indexOf(b.status)
            })[0]?.status || 'Saved'
            const cfg = STATUS[topStatus]
            return (
              <div key={company} style={{ background: 'var(--surface2)', border: `1px solid ${cfg.border}`, padding: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text)', marginBottom: 5, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>{company}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                  {compJobs.map(j => (
                    <span key={j.id} style={{ width: 6, height: 6, background: STATUS[j.status].color, display: 'inline-block' }} title={j.status} />
                  ))}
                </div>
                <div className="mono" style={{ fontSize: 9, color: cfg.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{topStatus}</div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Salary distribution */}
      <Card title="Salary_Distribution">
        {Object.entries(salaryGroups).map(([range, count]) => (
          <div key={range} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.04em' }}>{range}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--green)' }}>{count}</span>
            </div>
            <div style={{ height: 5, background: 'var(--border)' }}>
              <div style={{ height: '100%', width: `${total ? (count / total) * 100 : 0}%`, background: 'var(--green)', transition: 'width 0.5s' }} />
            </div>
          </div>
        ))}
        <div className="mono" style={{ marginTop: 10, fontSize: 9, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {jobs.length} roles tracked
        </div>
      </Card>

    </div>
  )
}

function Card({ title, children, style }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '18px 20px', ...style }}>
      <div className="mono" style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>// {title}</div>
      {children}
    </div>
  )
}

function Muted({ children }) {
  return <div className="mono" style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em' }}>{children}</div>
}
