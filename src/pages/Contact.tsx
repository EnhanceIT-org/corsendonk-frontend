import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Mail, ChevronRight } from "lucide-react";
import emailjs from '@emailjs/browser';

const Contact = () => {

  function sendEmail(e) {
    e.preventDefault();    //This is important, i'm not sure why, but the email won't send without it
    emailjs.sendForm('service_476n24e', 'template_p5xjqvn', e.target, 'V2CVWCO5koDdiRPRq')
      .then((result) => {
        console.log(result);  
        window.location.reload()  //This is if you still want the page to reload (since e.preventDefault() cancelled that behavior) 
      }, (error) => {
          console.log(error);
      });
  }

  return (
    <main className="pt-[60px]">
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-[calc(100vh-72px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <Link to="/" className="text-gray-600 hover:text-primary">Home</Link>
              </BreadcrumbItem>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <BreadcrumbItem>
                <span className="text-gray-900">Contact</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-8 text-center">
            <h1 className="pb-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Neem Contact Op
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Heeft u vragen of wilt u ontdekken hoe EnhanceIT uw bedrijf kan helpen? We horen graag van u!
            </p>
          </div>

          <div className="mt-16 max-w-xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <form className="space-y-6" id="contact-form" onSubmit={sendEmail}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Naam
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-mailadres
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Bedrijfsnaam
                  </label>
                  <input
                    type="text"
                    name="company"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Bericht
                  </label>
                  <textarea
                    name="message"
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  ></textarea>
                </div>

                <input
                  type="submit"
                  value="Verstuur"
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-full hover:from-blue-600 hover:to-indigo-600 transition-all"
                />
              </form>

              <div className="mt-8 pt-8 border-t">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Mail className="h-5 w-5" />
                  <a href="mailto:emile.descheemaeker@enhanceit.be" className="hover:text-primary">
                  emile.descheemaeker@enhanceit.be
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