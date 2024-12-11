import {
  BarChart3,
  FileSpreadsheet,
  GitFork,
  Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  {
    title: "Automatische Rapportgeneratoren",
    description:
      "Verminder menselijke fouten en bespaar tijd met software die rapporten automatisch genereert.",
    icon: FileSpreadsheet,
  },
  {
    title: "Interne Dashboards",
    description:
      "Realtime data binnen handbereik, overzichtelijk en op maat gemaakt.",
    icon: BarChart3,
  },
  {
    title: "Gegevensscraping",
    description:
      "Verzamel cruciale data efficiënt met op maat gemaakte scrapingtools.",
    icon: GitFork,
  },
  {
    title: "Workflow Optimalisatie",
    description:
      "Analyseer, verbeter en automatiseer uw processen voor maximale efficiëntie.",
    icon: Workflow,
  },
];

const Services = () => {
  return (
    <div className="bg-accent py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Onze Diensten
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Wij bieden verschillende oplossingen aan om uw bedrijf efficiënter te
            maken.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            {services.map((service) => (
              <div
                key={service.title}
                className="flex flex-col bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <service.icon
                    className="h-5 w-5 flex-none text-primary"
                    aria-hidden="true"
                  />
                  {service.title}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{service.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-16 text-center">
          <Link
            to="/diensten"
            className="text-primary hover:text-primary-hover font-semibold inline-flex items-center gap-2"
          >
            Lees meer over onze diensten
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Services;