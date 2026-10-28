import { Link } from 'react-router-dom';
import { ArrowRight, CircleHelp } from 'lucide-react';

const groups = [
  { title: 'Using GreenScope', items: [
    { q: 'What is GreenScope AI?', a: 'GreenScope AI is a prototype for exploring environmental indicators and organizing environmental concerns for review. It is not a government portal or a substitute for an official complaint channel.' },
    { q: 'How do I analyze a location?', a: 'Open Analyze, search for a place, define the area you want to examine and review the generated summary. Always check the data-status label and the assumptions shown with a result.' },
    { q: 'Can I submit a concern without logging in?', a: 'The public reporting prototype is designed to accept a concern without staff sign-in and return a reference. In the current prototype, records are stored in browser-local demo data; no real authority is notified.' },
    { q: 'How do I track a report?', a: 'Use Track a report and enter the reference. Current tracking is limited to demo records in the same browser environment. Production tracking should use a verified email or a secure access link and show only information the reporter is allowed to see.' },
  ]},
  { title: 'Data, maps and methodology', items: [
    { q: 'Are the current map and analysis results real-time environmental measurements?', a: 'Not necessarily. The current prototype may show illustrative or synthetic demo values. A map background or a location search does not mean that live satellite classification, ground sensors or official monitoring data have been connected. Treat demo outputs as examples, not measured facts.' },
    { q: 'What formula does GreenScope use for land-cover percentages?', a: 'For a genuine classified raster, a basic class-area share can be calculated as: area of pixels assigned to a class ÷ total valid classified area × 100. The result depends on pixel resolution, the boundary, valid-data masking, classification method and accuracy. This describes a standard calculation, not a claim that the current demo has performed a real pixel classification.' },
    { q: 'How would vegetation or carbon indicators be calculated?', a: 'Vegetation cover should be derived from a documented image source, date, spatial resolution and classification method, with accuracy limits disclosed. A carbon estimate requires a separate, justified model and assumptions such as biomass or carbon density, land-cover type and time period. The current prototype does not establish a validated site-level carbon inventory; any displayed demo values are illustrative.' },
    { q: 'Can satellite imagery prove that a site is polluting?', a: 'No. Satellite imagery can provide context or identify changes that warrant investigation, but it generally cannot by itself establish emissions, legal responsibility or a regulatory violation. Ground inspection, monitoring records, sampling and other evidence may be necessary.' },
    { q: 'What are the data sources and how current are they?', a: 'A production release should name each imagery or dataset provider, acquisition date, resolution, processing steps, licensing terms and known limitations. Until a specific source is shown alongside a result, do not assume the current prototype is connected to live or official environmental datasets.' },
  ]},
  { title: 'Reports, authorities and institutions', items: [
    { q: 'What happens after I submit a concern?', a: 'A production workflow should create a reference, triage the concern, route it to the competent authority, record review actions and share permitted status updates. The current prototype demonstrates parts of this flow with local demo data only.' },
    { q: 'Does a report automatically create an official notice or penalty?', a: 'No. A report is an allegation or a lead for review, not proof. Only a competent authority can decide whether a notice, inspection, deadline or enforcement action is appropriate under applicable law and procedure.' },
    { q: 'What can an institution do if it disagrees with a case?', a: 'The intended workflow allows an institution to provide context, submit supporting information, request clarification and explain why it believes a finding is inaccurate. The responsible authority should review the response and record its decision; a response is not automatically accepted or rejected.' },
    { q: 'Will my report and identity be visible to everyone?', a: 'They should not be. A production system should apply role-based access, protect reporter contact details and disclose only status information appropriate for the person viewing it. The present browser-local demo is not suitable for confidential or sensitive case management.' },
  ]},
  { title: 'Carbon credits and responsibility', items: [
    { q: 'Does a high vegetation score mean a site has earned carbon credits?', a: 'No. A vegetation or carbon estimate is not a carbon credit. Credits require an eligible project and program-specific rules, a defensible baseline, additionality, monitoring, reporting and verification or validation as required by that program.' },
    { q: 'Can GreenScope sell, certify or guarantee carbon credits?', a: 'No. GreenScope AI does not issue credits, certify offsets or guarantee market eligibility. Users should consult the relevant carbon standard and qualified independent professionals before making a carbon-market claim.' },
    { q: 'Can I use a GreenScope report as official evidence?', a: 'Do not treat a prototype report as an official determination. Check the underlying source data and obtain independent verification. Regulatory decisions must be made by the competent authority using the evidence and procedures required by applicable rules.' },
  ]},
];

export default function FAQ() {
  return <div>
    <section className="border-b border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
        <div className="flex items-center gap-3 text-primary"><CircleHelp className="h-5 w-5"/><p className="text-xs font-medium uppercase tracking-[0.2em]">Help and transparency</p></div>
        <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">Frequently asked questions</h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">How the prototype works, what its indicators mean, how reports should be handled, and what carbon estimates do—and do not—tell you.</p>
        <div className="mt-6 rounded-xl border border-border bg-card p-4 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Prototype disclosure:</strong> Some current results and report workflows use illustrative demo data. Formulas and methodology notes below explain general calculation principles; they do not imply that a validated live environmental model is already connected.</div>
      </div>
    </section>
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {groups.map((group, index) => <section key={group.title} className={index ? 'mt-12' : ''}>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">{group.title}</h2>
        <div className="mt-5 space-y-3">
          {group.items.map((item) => <details key={item.q} className="group rounded-2xl border border-border bg-card p-5 open:shadow-sm">
            <summary className="cursor-pointer list-none pr-6 font-medium text-foreground marker:hidden">{item.q}<span className="float-right text-primary transition-transform group-open:rotate-45">+</span></summary>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.a}</p>
          </details>)}
        </div>
      </section>)}
      <div className="mt-14 rounded-2xl border border-border bg-card/60 p-7">
        <h2 className="font-display text-xl font-semibold text-foreground">Still have a question?</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">For a concern about a location, submit a report. For the product's purpose and limitations, read About GreenScope.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/report" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Submit a concern <ArrowRight className="h-4 w-4"/></Link>
          <Link to="/about" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium">About GreenScope</Link>
        </div>
      </div>
    </section>
  </div>;
}
