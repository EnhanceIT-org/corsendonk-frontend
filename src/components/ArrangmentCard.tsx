import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ArrangmentCardProps {
  title: string;
  description: string;
  price: number;
  image: string;
  amenities: string[];
  selectedArrangement: string | null;
  setSelectedArrangement: (arrangment: string | null) => void;
}

export function ArrangmentCard({
  title,
  description,
  price,
  image,
  amenities,
  selectedArrangement,
  setSelectedArrangement,
}: ArrangmentCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg animate-fade-in">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="object-cover w-full h-full transition-transform hover:scale-105"
        />
      </div>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity) => (
            <span
              key={amenity}
              className="px-2 py-1 bg-secondary text-xs rounded-full"
            >
              {amenity}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="text-lg font-semibold">
          ${price}
          <span className="text-sm text-muted-foreground">/night</span>
        </div>
        <Button
          onClick={() => {
            setSelectedArrangement(title);
          }}
          className={`hover:bg-gray-500 transition-all duration-200 ${
            selectedArrangement === title ? "bg-gray-500" : "bg-accent"
          }`}
        >
          Select Arrangment
        </Button>
      </CardFooter>
    </Card>
  );
}
