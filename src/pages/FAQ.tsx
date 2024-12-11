import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    <main className="pt-[72px]">
      <div className="bg-gradient-to-tr from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} to="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>FAQ</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
              Veelgestelde Vragen
            </h1>
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
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