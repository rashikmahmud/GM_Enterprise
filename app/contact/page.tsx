"use client";

import { useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    // TODO: wire this to your backend / email API (Resend, Formspree, etc.)
    try {
      const formData = new FormData(e.currentTarget);
      console.log("Form submitted:", Object.fromEntries(formData));
      await new Promise((r) => setTimeout(r, 800));
      setStatus("sent");
      e.currentTarget.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          <span className="section-eyebrow">Contact</span>
          <h1 className="section-title">Get in Touch with GM Enterprise</h1>
          <p className="section-description">
            Contact us for clearing, forwarding, and shipping support services.
          </p>
        </div>

        <div className="contact-grid">
          {/* CONTACT INFO */}
          <div className="contact-card">
            <h3 style={{ marginTop: 0 }}>Contact Information</h3>
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:info@gmenterprise.com">info@gmenterprise.com</a>
            </p>
            <p>
              <strong>Phone:</strong>{" "}
              <a href="tel:+8801700000000">+880 1700 000000</a>
            </p>
            <p><strong>Location:</strong> Dhaka, Bangladesh</p>
            <p><strong>Hours:</strong> Sun–Thu, 9:00 AM – 6:00 PM</p>
          </div>

          {/* FORM */}
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" type="text" placeholder="Your name" required />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" placeholder="Your email" required />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" rows={5} placeholder="Your message" required />
            </div>

            <button type="submit" className="btn btn--primary" disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : "Send Message"}
            </button>

            {status === "sent" && (
              <p style={{ marginTop: 16, color: "var(--primary-light)" }}>
                ✅ Thanks! We&apos;ll get back to you shortly.
              </p>
            )}
            {status === "error" && (
              <p style={{ marginTop: 16, color: "#f87171" }}>
                ⚠️ Something went wrong. Please try again.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}