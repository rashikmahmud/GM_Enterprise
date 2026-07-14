export default function ContactPage() {
  return (
    <main>

      <section className="section">
        <div className="container">

          <div className="section-heading">
            <span className="section-eyebrow">Contact</span>

            <h1 className="section-title">
              Get in Touch with GM Enterprise
            </h1>

            <p className="section-description">
              Contact us for clearing, forwarding, and shipping support services.
            </p>
          </div>

          <div className="contact-grid">

            {/* CONTACT INFO */}
            <div className="contact-card">
              <h3>Contact Information</h3>
              <p>Email: info@gmenterprise.com</p>
              <p>Phone: +880 1700 000000</p>
              <p>Location: Dhaka, Bangladesh</p>
            </div>

            {/* FORM */}
            <form className="contact-form">

              <div className="form-group">
                <label>Name</label>
                <input type="text" placeholder="Your name" />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="Your email" />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea rows={5} placeholder="Your message"></textarea>
              </div>

              <button className="btn btn--primary">
                Send Message
              </button>

            </form>

          </div>

        </div>
      </section>

    </main>
  );
}