import React from "react";
import Link from "next/link";

export default function Footer() {
  const footerSections = [
    {
      title: "Solutions",
      links: [
        { label: "Application Services", href: "#" },
        { label: "Security Servers", href: "#" },
        { label: "Security FireWalls", href: "#" },
        { label: "Cloud Services", href: "#" },
        { label: "Integrations", href: "#" },
      ],
    },
    {
      title: "Partners",
      links: [
        { label: "Amazon", href: "#" },
        { label: "Figma", href: "#" },
        { label: "Twitter", href: "#" },
        { label: "CloudRail-IIOT", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Academy", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Themes", href: "#" },
        { label: "Hosting", href: "#" },
        { label: "Developers", href: "#" },
        { label: "Support", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Privacy Policy", href: "/terms" },
        { label: "Contact Us", href: "#" },
      ],
    },
  ];

  return (
    <footer className="w-full bg-black text-gray-400 text-xs border-t border-white/5 pt-16 pb-12 transition-colors">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
        {/* Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {footerSections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <h4 className="text-white font-semibold text-sm tracking-wide">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link
                      href={link.href}
                      className="hover:text-[#54f4fc] transition-colors inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider Line */}
        <div className="border-t border-neutral-800/80 my-8"></div>

        {/* Bottom Bar: Copyright & Socials */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-neutral-500 text-xs">
            <p>&copy; 2026 Sentinel Security. All Rights Reserved.</p>
            <span>•</span>
            <Link href="/terms" className="hover:text-[#54f4fc] transition-colors">
              Terms &amp; Privacy
            </Link>
          </div>

          {/* Social Icons */}
          <div className="flex items-center space-x-3 text-white">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-8 h-8 rounded-full border border-neutral-700 hover:border-[#54f4fc] hover:text-[#54f4fc] flex items-center justify-center transition-all"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.595 0 9 1.582 9 4.615V8z" />
              </svg>
            </a>

            {/* Telegram */}
            <a
              href="https://telegram.org"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="w-8 h-8 rounded-full border border-neutral-700 hover:border-[#54f4fc] hover:text-[#54f4fc] flex items-center justify-center transition-all"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-8 h-8 rounded-full border border-neutral-700 hover:border-[#54f4fc] hover:text-[#54f4fc] flex items-center justify-center transition-all"
            >
              <svg
                className="w-3.5 h-3.5 fill-none stroke-current"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>

            {/* Dribbble / Globe */}
            <a
              href="https://dribbble.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Dribbble"
              className="w-8 h-8 rounded-full border border-neutral-700 hover:border-[#54f4fc] hover:text-[#54f4fc] flex items-center justify-center transition-all"
            >
              <svg
                className="w-3.5 h-3.5 fill-none stroke-current"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94" />
                <path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32" />
                <path d="M8.53 2.27c3.96 4.93 6.04 11.02 6.57 19.38" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
