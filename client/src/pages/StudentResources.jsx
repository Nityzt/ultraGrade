import ResourceCard from '../components/immigration/ResourceCard';
import PageHeader from '../components/ui/PageHeader';
import { DollarSign, GraduationCap, Heart, Users, BookOpen, Briefcase } from 'lucide-react';

const RESOURCES = [
  {
    category: 'Financial Aid',
    icon: DollarSign,
    links: [
      { title: 'OSAP – Ontario Student Assistance Program', url: 'https://www.ontario.ca/page/osap-ontario-student-assistance-program', description: 'Apply for grants and loans for Ontario students', icon: DollarSign, badge: 'Key Resource' },
      { title: 'Canada Student Grants', url: 'https://www.canada.ca/en/services/benefits/education/student-aid/grants-loans.html', description: 'Federal grants and loans for post-secondary students', icon: DollarSign },
      { title: 'Ontario Bursary Programs', url: 'https://www.ontario.ca/page/osap-ontario-student-assistance-program#section-3', description: 'Bursaries for high-need domestic students', icon: DollarSign },
    ]
  },
  {
    category: 'Academic Support',
    icon: BookOpen,
    links: [
      { title: 'Ontario University Application Centre', url: 'https://www.ouac.on.ca/', description: 'Apply to Ontario universities and colleges', icon: GraduationCap },
      { title: 'Ontario College Application Service', url: 'https://www.ontariocolleges.ca/', description: 'Apply to Ontario colleges', icon: BookOpen },
      { title: 'eCampusOntario', url: 'https://www.ecampusontario.ca/', description: 'Online learning resources and courses', icon: BookOpen },
    ]
  },
  {
    category: 'Health & Wellness',
    icon: Heart,
    links: [
      { title: 'OHIP – Ontario Health Insurance Plan', url: 'https://www.ontario.ca/page/apply-ohip-and-get-health-card', description: 'Provincial health coverage for eligible Ontarians', icon: Heart, badge: 'Important' },
      { title: 'Student Health Plans', url: 'https://www.ontario.ca/page/get-help-with-prescription-drug-costs', description: 'Supplementary health coverage options', icon: Heart },
      { title: 'Campus Wellness Services', url: 'https://www.ontario.ca/page/mental-health-and-addictions-services', description: 'Mental health resources across Ontario', icon: Users },
    ]
  },
  {
    category: 'Career & Employment',
    icon: Briefcase,
    links: [
      { title: 'Ontario Job Bank', url: 'https://www.jobbank.gc.ca/home', description: 'Find jobs and career resources across Canada', icon: Briefcase },
      { title: 'Co-op and Internship Programs', url: 'https://www.ontario.ca/page/summer-jobs', description: "Ontario's co-op and experiential learning opportunities", icon: Briefcase },
      { title: 'Ontario Immigrant Nominee Program', url: 'https://www.ontario.ca/page/ontario-immigrant-nominee-program-oinp', description: 'Pathways to permanent residency for graduates', icon: Users },
    ]
  },
];

export default function StudentResources() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="Student Resources"
        icon={BookOpen}
        subtitle="Helpful links and resources for domestic students in Ontario."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {RESOURCES.map(({ category, icon: Icon, links }) => (
          <div key={category} className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icon size={18} className="text-primary" /> {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {links.map(link => (
                <ResourceCard key={link.url} {...link} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
