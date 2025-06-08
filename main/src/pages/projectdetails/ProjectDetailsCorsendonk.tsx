import { Link } from "react-router-dom";

const ProjectDetailCorsendonk = () => (
  <main className="pt-[60px]">
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/projecten" className="text-blue-600 hover:underline">
        &larr; Terug naar projecten
      </Link>
      <h1 className="text-4xl font-bold mt-4 mb-2">
        Van dagen wachten naar 1 minuut: Corsendonk Hotels versnelt reservaties
        met booking Engine
      </h1>
      <img
        src="/bookingEngine.png"
        alt="Corsendonk Hotels"
        className="rounded-lg mb-6 w-full"
      />

      <p className="mb-4">
        Corsendonk Hotels is een Belgische hotelgroep met vestigingen verspreid
        over Vlaanderen. Ze bieden onder meer wandel- en fietsarrangementen aan,
        waarbij gasten kunnen overnachten in verschillende hotels terwijl ze de
        regio al wandelend of fietsend verkennen. Tot voor kort verliep het
        reserveringsproces van deze arrangementen handmatig, vanwege het gebruik
        van meerdere boekingssystemen voor elk hotel.
      </p>

      <h2 className="text-xl font-semibold mb-2">De uitdaging</h2>
      <p className="mb-4">
        Voor elke aanvraag moesten medewerkers van de verschillende hotels
        telefonisch overleggen om beschikbaarheden en prijzen op elkaar af te
        stemmen. Dit proces nam vaak een volledige dag in beslag voordat er een
        voorstel naar de klant kon worden gestuurd — met het risico op fouten of
        afhakers door de lange wachttijd. Bovendien ging er veel kostbare tijd
        verloren voor de medewerkers, die geregeld moesten wachten op
        telefoontjes van collega’s om details te kunnen bevestigen.
      </p>

      <h2 className="text-xl font-semibold mb-2">Onze oplossing</h2>
      <p className="mb-4">
        We bouwden een gebruiksvriendelijke boekingsengine op maat van
        Corsendonk, die automatisch de beschikbaarheden en prijzen van de
        betrokken hotels synchroniseert. Zo kunnen medewerkers of klanten zelf
        met één klik een kant-en-klaar voorstel genereren — volledig correct en
        actueel.
      </p>

      <h2 className="text-xl font-semibold mb-2">Het resultaat</h2>
      <ul className="mb-4 list-disc list-inside">
        <li>Van &gt;24 uur naar &lt;1 minuut om een voorstel te maken</li>
        <li>Minder werkdruk voor medewerkers</li>
        <li>Snellere communicatie met klanten</li>
        <li>Hogere klanttevredenheid</li>
      </ul>

      <h2 className="text-xl font-semibold mb-2">Klant aan het woord</h2>
      <blockquote className="mb-6 border-l-4 border-blue-400 pl-4 italic text-gray-700">
        “De nieuwe tool heeft onze manier van werken volledig veranderd. Wat
        vroeger een frustrerend en omslachtig proces was, is nu supersnel en
        foutloos. We zijn enorm tevreden over de samenwerking met EnhanceIT.”
        <br />
        <span className="not-italic font-medium">— Corsendonk Hotels</span>
      </blockquote>

      <div className="mt-8">
        <p className="mb-2 font-semibold">
          Ook benieuwd wat slimme automatisatie voor jouw bedrijf kan doen?
        </p>
        <Link
          to="/contact"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          📩 Neem contact op
        </Link>
      </div>
    </div>
  </main>
);

export default ProjectDetailCorsendonk;
