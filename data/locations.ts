export interface Country {
    code: string;
    name: string;
    states?: State[];
}

export interface State {
    code: string;
    name: string;
    cities: string[];
}

export const countries: Country[] = [
    {
        code: 'US',
        name: 'United States',
        states: [
            {
                code: 'CA',
                name: 'California',
                cities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Fresno', 'Sacramento', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim']
            },
            {
                code: 'NY',
                name: 'New York',
                cities: ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'New Rochelle', 'Mount Vernon', 'Schenectady', 'Utica']
            },
            {
                code: 'TX',
                name: 'Texas',
                cities: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Lubbock']
            },
            {
                code: 'FL',
                name: 'Florida',
                cities: ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee', 'Fort Lauderdale', 'Port St. Lucie', 'Cape Coral']
            },
            {
                code: 'IL',
                name: 'Illinois',
                cities: ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Springfield', 'Peoria', 'Elgin', 'Waukegan', 'Cicero']
            }
        ]
    },
    {
        code: 'GB',
        name: 'United Kingdom',
        states: [
            {
                code: 'ENG',
                name: 'England',
                cities: ['London', 'Birmingham', 'Manchester', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Nottingham', 'Leicester', 'Coventry']
            },
            {
                code: 'SCT',
                name: 'Scotland',
                cities: ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Stirling', 'Perth', 'Inverness', 'Dumfries', 'Ayr', 'Falkirk']
            },
            {
                code: 'WLS',
                name: 'Wales',
                cities: ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry', 'Caerphilly', 'Rhondda', 'Merthyr Tydfil', 'Bridgend', 'Port Talbot']
            },
            {
                code: 'NIR',
                name: 'Northern Ireland',
                cities: ['Belfast', 'Derry', 'Lisburn', 'Newtownabbey', 'Bangor', 'Craigavon', 'Castlereagh', 'Newry', 'Carrickfergus', 'Antrim']
            }
        ]
    },
    {
        code: 'CA',
        name: 'Canada',
        states: [
            {
                code: 'ON',
                name: 'Ontario',
                cities: ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Markham', 'Vaughan', 'Kitchener', 'Windsor']
            },
            {
                code: 'BC',
                name: 'British Columbia',
                cities: ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Abbotsford', 'Coquitlam', 'Saanich', 'Delta', 'Kelowna', 'Langley']
            },
            {
                code: 'AB',
                name: 'Alberta',
                cities: ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'St. Albert', 'Medicine Hat', 'Grande Prairie', 'Airdrie', 'Spruce Grove', 'Leduc']
            },
            {
                code: 'QC',
                name: 'Quebec',
                cities: ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay', 'Levis', 'Trois-Rivieres', 'Terrebonne']
            }
        ]
    },
    {
        code: 'AU',
        name: 'Australia',
        states: [
            {
                code: 'NSW',
                name: 'New South Wales',
                cities: ['Sydney', 'Newcastle', 'Wollongong', 'Maitland', 'Albury', 'Wagga Wagga', 'Tamworth', 'Orange', 'Dubbo', 'Nowra']
            },
            {
                code: 'VIC',
                name: 'Victoria',
                cities: ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Shepparton', 'Warrnambool', 'Mildura', 'Traralgon', 'Frankston', 'Dandenong']
            },
            {
                code: 'QLD',
                name: 'Queensland',
                cities: ['Brisbane', 'Gold Coast', 'Townsville', 'Cairns', 'Toowoomba', 'Rockhampton', 'Mackay', 'Bundaberg', 'Hervey Bay', 'Gladstone']
            },
            {
                code: 'WA',
                name: 'Western Australia',
                cities: ['Perth', 'Fremantle', 'Rockingham', 'Mandurah', 'Bunbury', 'Geraldton', 'Albany', 'Broome', 'Kalgoorlie', 'Port Hedland']
            }
        ]
    },
    {
        code: 'DE',
        name: 'Germany',
        states: [
            {
                code: 'BY',
                name: 'Bavaria',
                cities: ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg', 'Würzburg', 'Ingolstadt', 'Fürth', 'Erlangen', 'Bayreuth', 'Bamberg']
            },
            {
                code: 'NW',
                name: 'North Rhine-Westphalia',
                cities: ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster']
            },
            {
                code: 'BW',
                name: 'Baden-Württemberg',
                cities: ['Stuttgart', 'Mannheim', 'Karlsruhe', 'Freiburg', 'Heidelberg', 'Heilbronn', 'Ulm', 'Pforzheim', 'Reutlingen', 'Tübingen']
            },
            {
                code: 'BE',
                name: 'Berlin',
                cities: ['Berlin']
            }
        ]
    },
    {
        code: 'FR',
        name: 'France',
        states: [
            {
                code: 'IDF',
                name: 'Île-de-France',
                cities: ['Paris', 'Boulogne-Billancourt', 'Saint-Denis', 'Argenteuil', 'Montreuil', 'Nanterre', 'Vitry-sur-Seine', 'Créteil', 'Dunkerque', 'Nantes']
            },
            {
                code: 'ARA',
                name: 'Auvergne-Rhône-Alpes',
                cities: ['Lyon', 'Saint-Étienne', 'Grenoble', 'Villeurbanne', 'Clermont-Ferrand', 'Annecy', 'Valence', 'Chambéry', 'Le Puy-en-Velay', 'Roanne']
            },
            {
                code: 'PACA',
                name: 'Provence-Alpes-Côte d\'Azur',
                cities: ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Avignon', 'Antibes', 'Cannes', 'La Seyne-sur-Mer', 'Hyères', 'Fréjus']
            }
        ]
    },
    {
        code: 'JP',
        name: 'Japan',
        states: [
            {
                code: '13',
                name: 'Tokyo',
                cities: ['Tokyo', 'Shibuya', 'Shinjuku', 'Ikebukuro', 'Ueno', 'Asakusa', 'Harajuku', 'Ginza', 'Roppongi', 'Akihabara']
            },
            {
                code: '27',
                name: 'Osaka',
                cities: ['Osaka', 'Sakai', 'Higashiosaka', 'Toyonaka', 'Hirakata', 'Neyagawa', 'Suita', 'Yao', 'Ibaraki', 'Moriguchi']
            },
            {
                code: '14',
                name: 'Kanagawa',
                cities: ['Yokohama', 'Kawasaki', 'Sagamihara', 'Fujisawa', 'Yokosuka', 'Chigasaki', 'Atsugi', 'Yamato', 'Odawara', 'Zama']
            }
        ]
    },
    {
        code: 'IN',
        name: 'India',
        states: [
            {
                code: 'MH',
                name: 'Maharashtra',
                cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Sangli']
            },
            {
                code: 'DL',
                name: 'Delhi',
                cities: ['New Delhi', 'Central Delhi', 'East Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi']
            },
            {
                code: 'KA',
                name: 'Karnataka',
                cities: ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere', 'Bellary', 'Bijapur', 'Shimoga']
            },
            {
                code: 'TN',
                name: 'Tamil Nadu',
                cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukkudi']
            }
        ]
    },
    {
        code: 'BR',
        name: 'Brazil',
        states: [
            {
                code: 'SP',
                name: 'São Paulo',
                cities: ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'Osasco', 'Ribeirão Preto', 'Sorocaba', 'Mauá', 'São José dos Campos']
            },
            {
                code: 'RJ',
                name: 'Rio de Janeiro',
                cities: ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Belford Roxo', 'São João de Meriti', 'Campos dos Goytacazes', 'Petrópolis', 'Volta Redonda']
            },
            {
                code: 'MG',
                name: 'Minas Gerais',
                cities: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga']
            }
        ]
    },
    {
        code: 'CN',
        name: 'China',
        states: [
            {
                code: 'BJ',
                name: 'Beijing',
                cities: ['Beijing', 'Chaoyang', 'Haidian', 'Fengtai', 'Shijingshan', 'Mentougou', 'Fangshan', 'Tongzhou', 'Shunyi', 'Changping']
            },
            {
                code: 'SH',
                name: 'Shanghai',
                cities: ['Shanghai', 'Pudong', 'Huangpu', 'Xuhui', 'Changning', 'Jing\'an', 'Putuo', 'Hongkou', 'Yangpu', 'Minhang']
            },
            {
                code: 'GD',
                name: 'Guangdong',
                cities: ['Guangzhou', 'Shenzhen', 'Dongguan', 'Foshan', 'Zhongshan', 'Huizhou', 'Jiangmen', 'Zhuhai', 'Shantou', 'Zhanjiang']
            }
        ]
    }
];

// Helper functions
export const getCountryByCode = (code: string): Country | undefined => {
    return countries.find(country => country.code === code);
};

export const getStateByCode = (countryCode: string, stateCode: string): State | undefined => {
    const country = getCountryByCode(countryCode);
    return country?.states?.find(state => state.code === stateCode);
};

export const getCitiesByState = (countryCode: string, stateCode: string): string[] => {
    const state = getStateByCode(countryCode, stateCode);
    return state?.cities || [];
};

export const getAllCountries = (): Country[] => {
    return countries;
};

export const getStatesByCountry = (countryCode: string): State[] => {
    const country = getCountryByCode(countryCode);
    return country?.states || [];
};



