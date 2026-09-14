import React from 'react';
import './App.css';

const services = [
  ['Full synthetic oil change', 'Up to 5 quarts, filter, fluid check, reset reminder'],
  ['Fleet oil service', 'On-site preventive maintenance for work vans and light-duty fleets'],
  ['Filters & wipers', 'Cabin filters, engine filters, and replacement wiper blades'],
];

const DEFAULT_EXPERIENCE = {
  name: 'Quick Mobile Oil Change',
  tagline: 'Professional oil service at your home, office, or fleet lot. Choose a time, park the vehicle, and keep your day moving.',
  primaryColor: '#d8ff47',
};

function readExperience() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('ms_name')?.trim() || DEFAULT_EXPERIENCE.name;
  const tagline = params.get('ms_tagline')?.trim() || DEFAULT_EXPERIENCE.tagline;
  const requestedColor = params.get('ms_color')?.trim() || DEFAULT_EXPERIENCE.primaryColor;
  const primaryColor = /^#[0-9a-f]{6}$/i.test(requestedColor) ? requestedColor : DEFAULT_EXPERIENCE.primaryColor;
  return { name, tagline, primaryColor, mark: name.charAt(0).toUpperCase() || 'Q' };
}

function App() {
  const experience = readExperience();

  return (
    <main className="site-shell" style={{ '--accent': experience.primaryColor }}>
      <header className="nav">
        <a className="brand" href="#top" aria-label={experience.name + ' home'}>
          <span className="brand-mark">{experience.mark}</span>
          <span>{experience.name}</span>
        </a>
        <a className="nav-cta" href="#book">Book service</a>
      </header>

      <section id="top" className="hero">
        <div className="hero-copy">
          <div className="eyebrow">Mobile oil change · We come to you</div>
          <h1>Oil changes without the waiting room.</h1>
          <p className="lead">{experience.tagline}</p>
          <div className="hero-actions">
            <a className="button button-dark" href="#book">Book an oil change</a>
            <a className="button button-light" href="#services">See services</a>
          </div>
          <div className="trust-row">
            <span>At-home service</span>
            <span>Fleet-friendly</span>
            <span>Digital service record</span>
          </div>
        </div>

        <aside className="booking-card" id="book">
          <div className="booking-kicker">Simple booking</div>
          <h2>Get your next oil change handled.</h2>
          <p>Pick the vehicle, choose your service, and select a time that works.</p>
          <form onSubmit={(event) => event.preventDefault()}>
            <label>Vehicle<input placeholder="Year, make, model" /></label>
            <label>ZIP code<input inputMode="numeric" placeholder="19002" /></label>
            <button className="button button-accent" type="submit">Check availability</button>
          </form>
          <small>{experience.name} · powered by MultiSaaS.</small>
        </aside>
      </section>

      <section id="services" className="section">
        <div className="section-heading">
          <div className="eyebrow">What we do</div>
          <h2>Routine vehicle care, brought to the driveway.</h2>
        </div>
        <div className="service-grid">
          {services.map(([title, text], index) => (
            <article className="service-card" key={title}>
              <div className="service-number">0{index + 1}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="split-section">
        <div><div className="eyebrow">Built for real schedules</div><h2>Home, office, or fleet lot.</h2></div>
        <div className="split-copy">
          <p>Mobile service removes the drive, the lobby, and the lost hour. We bring the basic preventive maintenance workflow to the vehicle instead.</p>
          <ul>
            <li>Book online</li><li>Receive service confirmation</li><li>Technician arrives on site</li><li>Digital completion record</li>
          </ul>
        </div>
      </section>

      <section className="proof">
        <div>
          <div className="proof-label">This is a MultiSaaS proof Experience</div>
          <h2>One product. One release. A completely separate customer-facing brand.</h2>
        </div>
        <p>The goal of this site is to prove that a single maintained application can be routed through a verified custom domain and operated as an independent Experience.</p>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark">{experience.mark}</span><span>{experience.name}</span></div>
        <span>Mobile preventive maintenance</span>
      </footer>
    </main>
  );
}

export default App;
