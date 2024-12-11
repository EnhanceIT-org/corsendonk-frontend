import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

const Contact = () => {
  return (
    <main className="pt-[72px]">
      <div className="bg-gradient-to-bl from-indigo-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} to="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>Contact</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
              Neem Contact Op
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Heeft u vragen of wilt u ontdekken hoe EnhanceIT uw bedrijf kan helpen? We horen graag van u!
            </p>
          </div>

          <div className="mt-16 max-w-xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Naam
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-mailadres
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Bedrijfsnaam
                  </label>
                  <input
                    type="text"
                    id="company"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Bericht
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-full hover:from-blue-600 hover:to-indigo-600 transition-all"
                >
                  Verstuur
                </button>
              </form>

              <div className="mt-8 pt-8 border-t">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Mail className="h-5 w-5" />
                  <a href="mailto:info@enhanceit.be" className="hover:text-primary">
                    info@enhanceit.be
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Contact;