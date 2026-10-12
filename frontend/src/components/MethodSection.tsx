import { CONTACTS, ENTITIES } from '../lib/data'

export function MethodSection() {
  return (
    <section id="method" className="section method">
      <div className="section-head">
        <h2>How to read an answer</h2>
      </div>
      <div className="prose">
        <p>
          Chronicle holds {ENTITIES.length} entries, each with a start and end year and a margin of error, and {CONTACTS.length} links between them. A link means
          that goods, people, armies, envoys or texts moved between two entries during a stated period.
        </p>
        <dl>
          <dt><span className="tier tier-documented">documented</span></dt>
          <dd>Attested in a source: a trade route, an embassy, a battle, a text that names the other party.</dd>
          <dt><span className="tier tier-plausible">plausible</span></dt>
          <dd>Consistent with the evidence, but not attested for these two parties. Arab merchants on India's coasts is an example: well known in general, unrecorded for a particular dynasty.</dd>
          <dt>Not recorded</dt>
          <dd>The dataset has no link. This means unrecorded here, never impossible. Oral histories and non-written societies are underrepresented, and that bias is real.</dd>
        </dl>
        <p>
          Chains of links only count if every link was active during a shared stretch of years. A two-year coincidence of dates is not accepted as a chain, and long chains
          are flagged because knowledge fades with each hand it passes through.
        </p>
        <p>
          Sources are starting points, mostly encyclopedia articles, and should be checked against scholarly work. Corrections are welcome in the
          {' '}<a href="https://github.com/RamjeU/chronicle" target="_blank" rel="noreferrer">repository</a>.
        </p>
        <p className="muted">
          Earth imagery: NASA Visible Earth / Blue Marble (public domain), packaged with the three-globe library (MIT).
        </p>
      </div>
    </section>
  )
}
