import PortfolioSubdomainPage, { generateMetadata } from "@/app/portfolio/[username]/page";

export function generateStaticParams() {
  return [
    { username: "layla" },
    { username: "youssef" },
    { username: "farida" },
    { username: "karim" },
    { username: "tariq" },
    { username: "salma" },
    { username: "nora" },
    { username: "_shell" },
  ];
}

export { generateMetadata };
export default PortfolioSubdomainPage;
