import { Link } from "revine";

export default function HomePage() {
  return (
    <main>
      {/* Hero Section */}
      <div>
        <h1>
          Welcome to <span>Revine</span>
        </h1>
        <p>The modern, powerful, and streamlined React framework.</p>
      </div>

      {/* CTA Buttons */}
      <div className="cta">
        <Link to="#get-started" className="primary-btn">
          Get Started
        </Link>
        <Link to="#docs" className="secondary-btn">
          Read Docs
        </Link>
      </div>

      {/* Features Section */}
      <div className="features">
        <Link to="#fast">
          <h3>Lightning Fast</h3>
          <p>Built on Vite for ultra-fast development and instant HMR.</p>
        </Link>
        <Link to="#routing">
          <h3>Simple File-based Routing</h3>
          <p>
            Create pages in <code>src/pages</code> and Revine will handle the
            rest.
          </p>
        </Link>
        <Link to="#tailwind">
          <h3>Tailwind Integration</h3>
          <p>
            Pre-configured for Tailwind CSS, so you can style quickly and
            easily.
          </p>
        </Link>
        <Link to="#dev-experience">
          <h3>Great DX</h3>
          <p>Minimal config, fast builds, custom logging, and more.</p>
        </Link>
        <Link to="#abstract">
          <h3>Abstracted Internals</h3>
          <p>
            A .revine folder houses the complex Vite config. Keep your root
            clean.
          </p>
        </Link>
        <Link to="#customize">
          <h3>Fully Customizable</h3>
          <p>
            Easily extend or override settings in <code>revine.config.ts</code>.
          </p>
        </Link>
      </div>
    </main>
  );
}
