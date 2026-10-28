import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, MapPinned, ShieldCheck, Users } from 'lucide-react';

const principles = [
  { icon: MapPinned, title: 'Place-based insight', body: 'Explore a defined area and organize environmental indicators in a readable report. The quality of the result depends on the underlying imagery, data sources and method.' },
  { icon: ShieldCheck, title: 'Evidence before conclusions', body: 'A map, model estimate or community report is a signal for review-not proof that a person or institution has broken a law.' },
  { icon: Users, title: 'A shared response process', body: 'The intended workflow connects public reporting, administrative triage, relevant authorities and institution responses, with status updates where appropriate.' },
];

export default function About() {
  return <div>
    <section className="border-b border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">About GreenScope AI</p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">Environmental information should lead to better questions-and better decisions.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">GreenScope AI is a prototype for exploring environmental indicators, documenting concerns and organizing a transparent review workflow. It is designed to help people understand a place and help the responsible teams decide what needs further verification.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/analyze" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Explore an area <ArrowRight className="h-4 w-4"/></Link>
          <Link to="/report" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium">Report a concern</Link>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-6 md:grid-cols-3">
        {principles.map(({icon: Icon, title, body}) => <article key={title} className="rounded-2xl border border-border bg-card p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5"/></span>
          <h2 className="mt-5 font-display text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
        </article>)}
      </div>
    </section>
    <section className="border-y border-border/60 bg-card/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div><div className="flex items-center gap-3 text-primary"><Leaf className="h-5 w-5"/><p className="text-xs font-medium uppercase tracking-[0.2em]">Carbon and climate</p></div>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground">Carbon estimates are not carbon credits.</h2>
          <p className="mt-4 leading-7 text-muted-foreground">An estimate of vegetation cover or potential carbon storage does not, by itself, create a tradable carbon credit. Carbon credits generally require a defined project, an eligible methodology, a credible baseline, additionality, monitoring, reporting, independent validation or verification where required, and issuance under a recognized program.</p>
          <p className="mt-4 leading-7 text-muted-foreground">GreenScope AI does not issue carbon credits, certify offsets or guarantee that a site qualifies for a carbon market. Any future carbon estimate must state its data source, assumptions, units, uncertainty and applicable methodology.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-7">
          <h3 className="font-display text-xl font-semibold text-foreground">What GreenScope is-and isn't</h3>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
            <li><strong className="text-foreground">It is:</strong> a prototype for environmental exploration, concern intake and case coordination.</li>
            <li><strong className="text-foreground">It can support:</strong> prioritizing questions for field checks and bringing relevant information together.</li>
            <li><strong className="text-foreground">It is not:</strong> a regulator, a laboratory, a legal finding or an official carbon-credit registry.</li>
            <li><strong className="text-foreground">Important prototype limitation:</strong> some current analysis and report records use illustrative/demo data stored locally. They are not live official records, and a submission does not notify a real authority.</li>
          </ul>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">Transparency is part of the product.</h2>
      <p className="mt-4 leading-relaxed text-muted-foreground">We aim to distinguish observed data, model outputs, user-submitted allegations and official decisions. Before any result is used for regulatory action, the responsible authority must independently assess the evidence under applicable law and procedure.</p>
      <Link to="/faq" className="mt-7 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium">Read the FAQs <ArrowRight className="h-4 w-4"/></Link>
    </section>
  </div>;
}
