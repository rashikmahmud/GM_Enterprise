import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Clearing, forwarding, cargo documentation, freight coordination, port operations, and logistics support.",
};

const services = [
  {
    title: "Clearing & Forwarding",
    desc: "Efficient handling of import and export processes with smooth coordination through customs.",
  },
  {
    title: "Shipping Agent Support",
    desc: "Professional assistance in vessel coordination, cargo handling, and shipping operations.",
  },
  {
    title: "Cargo Documentation",
    desc: "Organized support for shipping and logistics documents to ensure compliance and smooth flow.",
  },
  {
    title: "Freight Coordination",
    desc: "Planning and organizing cargo movement across different transport channels.",
  },
  {
    title: "Port Operations",
    desc: "Communication and coordination support between stakeholders at port.",
  },
  {
    title: "Logistics Support",
    desc: "End-to-end assistance for cargo movement and client communication.",
  },
];

const process = [
  { step: "01", title: "Consultation", desc: "We understand your cargo, route, and timeline requirements." },
  { step: "02", title: "Documentation", desc: "We prepare and verify all shipping and customs documents." },
  { step: "03", title: "Coordination", desc: "We coordinate with ports, carriers, and customs authorities." },
  { step: "04", title: "Delivery", desc: "We ensure smooth clearance and hand-off of your cargo." },
];

export default function ServicesPage() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          <span className="section-eyebrow">Services</span>
          <h1 className="section-title">
            Professional C&amp;F and Shipping Services
          </h1>
          <p className="section-description">
            GM Enterprise provides reliable clearing, forwarding, and shipping
            support tailored for importers and exporters.
          </p>
        </div>

        {/* Services grid */}
        <div className="card-grid">
          {services.map((s) => (
            <div key={s.title} className="info-card">
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Process timeline */}
        <div className="section-heading" style={{ marginTop: 80 }}>
          <span className="section-eyebrow">How We Work</span>
          <h2 className="section-title">Our Process</h2>
        </div>

        <div className="timeline">
          {process.map((p) => (
            <div key={p.step} className="timeline__item">
              <div className="timeline__step">{p.step}</div>
              <div className="timeline__content">
                <h3 style={{ marginTop: 0 }}>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="section-actions">
          <Link href="/contact" className="btn btn--primary">
            Request a Quote
          </Link>
        </div>
      </div>
    </section>
  );
}