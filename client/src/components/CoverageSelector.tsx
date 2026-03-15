import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface City {
  id: number;
  name: string;
  country: string;
  isForeignCity: boolean;
}

interface CoverageSelectorProps {
  cities: City[];
  onCitiesChange: (selectedCities: { id: number; isForeignCity: boolean }[]) => void;
  onPriceChange: (price: number) => void;
  socialMediaAddonEnabled?: boolean;
}

const BASE_PRICE = 350; // DT
const INCLUDED_CITIES = 3;
const EXTRA_NATIONAL = 50; // DT par ville supplémentaire
const EXTRA_FOREIGN = 100; // DT par ville étrangère
const SOCIAL_ADDON = 50; // DT

export function CoverageSelector({
  cities,
  onCitiesChange,
  onPriceChange,
  socialMediaAddonEnabled = false,
}: CoverageSelectorProps) {
  const [selectedCities, setSelectedCities] = useState<Set<number>>(new Set());
  const [nationalCities, setNationalCities] = useState(0);
  const [foreignCities, setForeignCities] = useState(0);

  // Séparer les villes nationales et étrangères
  const tunisianCities = cities.filter(c => !c.isForeignCity);
  const foreignCitiesList = cities.filter(c => c.isForeignCity);

  // Calculer le prix
  useEffect(() => {
    const extraNational = Math.max(0, nationalCities - INCLUDED_CITIES) * EXTRA_NATIONAL;
    const extraForeign = foreignCities * EXTRA_FOREIGN;
    const addon = socialMediaAddonEnabled ? SOCIAL_ADDON : 0;
    const monthlyPrice = BASE_PRICE + extraNational + extraForeign + addon;

    onPriceChange(monthlyPrice);
  }, [nationalCities, foreignCities, socialMediaAddonEnabled, onPriceChange]);

  const handleCityToggle = (cityId: number, isForeignCity: boolean) => {
    const newSelected = new Set(selectedCities);

    if (newSelected.has(cityId)) {
      newSelected.delete(cityId);
      if (isForeignCity) {
        setForeignCities(f => f - 1);
      } else {
        setNationalCities(n => n - 1);
      }
    } else {
      newSelected.add(cityId);
      if (isForeignCity) {
        setForeignCities(f => f + 1);
      } else {
        setNationalCities(n => n + 1);
      }
    }

    setSelectedCities(newSelected);
    const citiesArray = Array.from(newSelected).map(id => {
      const city = cities.find(c => c.id === id);
      return { id, isForeignCity: city?.isForeignCity || false };
    });
    onCitiesChange(citiesArray);
  };

  const isIncludedCity = (index: number) => index < INCLUDED_CITIES;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>📍 Couverture géographique</CardTitle>
          <CardDescription>Sélectionnez les villes où diffuser vos publicités</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Villes nationales */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              🇹🇳 Villes nationales (Tunisie)
              <Badge variant="secondary">{nationalCities} sélectionnées</Badge>
            </h3>
            <div className="space-y-2">
              {tunisianCities.map((city, index) => (
                <div key={city.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                  <Checkbox
                    id={`city-${city.id}`}
                    checked={selectedCities.has(city.id)}
                    onCheckedChange={() => handleCityToggle(city.id, false)}
                  />
                  <Label htmlFor={`city-${city.id}`} className="flex-1 cursor-pointer">
                    <span className="font-medium">{city.name}</span>
                    {isIncludedCity(index) && (
                      <Badge className="ml-2" variant="default">
                        INCLUS
                      </Badge>
                    )}
                    {!isIncludedCity(index) && (
                      <Badge className="ml-2" variant="outline">
                        +50 DT/mois
                      </Badge>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Villes internationales */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              🌍 Villes internationales
              <Badge variant="secondary">{foreignCities} sélectionnées</Badge>
            </h3>
            <div className="space-y-2">
              {foreignCitiesList.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucune ville internationale disponible</p>
              ) : (
                foreignCitiesList.map(city => (
                  <div key={city.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id={`city-${city.id}`}
                      checked={selectedCities.has(city.id)}
                      onCheckedChange={() => handleCityToggle(city.id, true)}
                    />
                    <Label htmlFor={`city-${city.id}`} className="flex-1 cursor-pointer">
                      <span className="font-medium">{city.name}</span>
                      <Badge className="ml-2" variant="outline">
                        +100 DT/mois
                      </Badge>
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Alerte si aucune ville sélectionnée */}
          {selectedCities.size === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sélectionnez au moins une ville pour créer une campagne
              </AlertDescription>
            </Alert>
          )}

          {/* Alerte si moins de 3 villes nationales */}
          {nationalCities < INCLUDED_CITIES && nationalCities > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vous avez sélectionné {nationalCities} ville(s) nationale(s). Le plan inclut {INCLUDED_CITIES} villes.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Récapitulatif des prix */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg">💰 Récapitulatif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Plan de base</span>
            <span className="font-semibold">{BASE_PRICE} DT</span>
          </div>
          {nationalCities > INCLUDED_CITIES && (
            <div className="flex justify-between text-orange-600">
              <span>+ Villes nationales supplémentaires ({nationalCities - INCLUDED_CITIES})</span>
              <span className="font-semibold">+{(nationalCities - INCLUDED_CITIES) * EXTRA_NATIONAL} DT</span>
            </div>
          )}
          {foreignCities > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>+ Villes internationales ({foreignCities})</span>
              <span className="font-semibold">+{foreignCities * EXTRA_FOREIGN} DT</span>
            </div>
          )}
          {socialMediaAddonEnabled && (
            <div className="flex justify-between text-purple-600">
              <span>+ Social Media Manager</span>
              <span className="font-semibold">+{SOCIAL_ADDON} DT</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between text-lg font-bold">
            <span>Total / mois</span>
            <span className="text-blue-600">
              {BASE_PRICE +
                Math.max(0, nationalCities - INCLUDED_CITIES) * EXTRA_NATIONAL +
                foreignCities * EXTRA_FOREIGN +
                (socialMediaAddonEnabled ? SOCIAL_ADDON : 0)}{" "}
              DT
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
