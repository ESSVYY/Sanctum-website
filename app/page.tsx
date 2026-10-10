import './editorial.css';
import { CustomAiSection, AppliedAiSection, AiProcessSection } from '@/components/custom-ai';
import { HomeInsights } from '@/components/blog/home-insights';
export const dynamic = 'force-dynamic';
import * as Reference from '@/components/reference-sections';
import { WebsiteInteractions } from '@/components/website-interactions';
import { Assistant } from '@/components/assistant';
export default function Home() {
 return <><a className="skip-link" href="#main-content">Skip to content</a><Reference.ReferenceHeader/><WebsiteInteractions/><main id="main-content"><Reference.HeroSection/><Reference.ServiceTicker/><Reference.ProblemsSection/><Reference.FounderSection/><Reference.TransformationSection/><Reference.ServicesSection/><Reference.WorkflowsSection/><Reference.AnalyticsSection/><Reference.RoiSection/><CustomAiSection/><AppliedAiSection/><AiProcessSection/><Reference.PricingSection/><Reference.CaseStudiesSection/><Reference.IndustriesSection/><Reference.ProcessSection/><Reference.FaqSection/><HomeInsights/><Reference.ContactSection/></main><Reference.ReferenceFooter/><Assistant/></>;
}
