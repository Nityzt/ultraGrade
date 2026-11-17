import OnboardingWizard from '../onboarding/OnboardingWizard.jsx';

export default function DemoOnboarding({ onDone }) {
  return <div className="demo-original-onboarding"><OnboardingWizard demo onFinish={onDone} /></div>;
}
