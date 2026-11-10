import PortfolioSubdomainPage, { generateMetadata } from "@/app/portfolio/[username]/page";

export function generateStaticParams() {
  return [
    { username: "test" },
    { username: "layla" },
    { username: "youssef" },
    { username: "farida" },
    { username: "karim" },
  ];
}

export { generateMetadata };
export default PortfolioSubdomainPage;
