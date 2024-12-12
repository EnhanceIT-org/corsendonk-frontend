import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronRight } from "lucide-react";

const FAQ = () => {
  const faqs = [
    {
      question: "Hoe weet ik of mijn bedrijf baat heeft bij automatisering?",
      answer: "Als u merkt dat uw team veel tijd verliest aan repetitieve taken, kunnen wij u helpen processen te automatiseren."
    },
    {
      question: "Zijn de oplossingen van EnhanceIT geschikt voor kleine bedrijven?",
      answer: "Ja! Onze oplossingen zijn schaalbaar en passen zich aan uw behoeften aan."
    },
    {
      question: "Hoe lang duurt het om een oplossing te ontwikkelen?",
      answer: "Dit hangt af van de complexiteit van het project, maar we werken snel en efficiënt zonder in te boeten op kwaliteit."
    }
  ];

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
                <span className="text-gray-900">FAQ</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-8 text-center">
            <h1 className="pb-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Veelgestelde Vragen
            </h1>
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left hover:text-primary transition-colors">{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </main>
  );
};

export default FAQ;