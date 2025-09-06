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

// Comprehensive worldwide location data
export const countries: Country[] = [
    // North America
    {
        code: 'US',
        name: 'United States',
        states: [
            { code: 'AL', name: 'Alabama', cities: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa'] },
            { code: 'AK', name: 'Alaska', cities: ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan'] },
            { code: 'AZ', name: 'Arizona', cities: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale'] },
            { code: 'AR', name: 'Arkansas', cities: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro'] },
            { code: 'CA', name: 'California', cities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Fresno', 'Sacramento', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim'] },
            { code: 'CO', name: 'Colorado', cities: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood'] },
            { code: 'CT', name: 'Connecticut', cities: ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury'] },
            { code: 'DE', name: 'Delaware', cities: ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna'] },
            { code: 'FL', name: 'Florida', cities: ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee', 'Fort Lauderdale', 'Port St. Lucie', 'Cape Coral'] },
            { code: 'GA', name: 'Georgia', cities: ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens'] },
            { code: 'HI', name: 'Hawaii', cities: ['Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Kaneohe'] },
            { code: 'ID', name: 'Idaho', cities: ['Boise', 'Nampa', 'Meridian', 'Idaho Falls', 'Pocatello'] },
            { code: 'IL', name: 'Illinois', cities: ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Springfield', 'Peoria', 'Elgin', 'Waukegan', 'Cicero'] },
            { code: 'IN', name: 'Indiana', cities: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel'] },
            { code: 'IA', name: 'Iowa', cities: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City'] },
            { code: 'KS', name: 'Kansas', cities: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka', 'Olathe'] },
            { code: 'KY', name: 'Kentucky', cities: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington'] },
            { code: 'LA', name: 'Louisiana', cities: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles'] },
            { code: 'ME', name: 'Maine', cities: ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn'] },
            { code: 'MD', name: 'Maryland', cities: ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Bowie'] },
            { code: 'MA', name: 'Massachusetts', cities: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell'] },
            { code: 'MI', name: 'Michigan', cities: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Lansing'] },
            { code: 'MN', name: 'Minnesota', cities: ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth', 'Bloomington'] },
            { code: 'MS', name: 'Mississippi', cities: ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi'] },
            { code: 'MO', name: 'Missouri', cities: ['Kansas City', 'Saint Louis', 'Springfield', 'Independence', 'Columbia'] },
            { code: 'MT', name: 'Montana', cities: ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte'] },
            { code: 'NE', name: 'Nebraska', cities: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney'] },
            { code: 'NV', name: 'Nevada', cities: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks'] },
            { code: 'NH', name: 'New Hampshire', cities: ['Manchester', 'Nashua', 'Concord', 'Derry', 'Rochester'] },
            { code: 'NJ', name: 'New Jersey', cities: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison'] },
            { code: 'NM', name: 'New Mexico', cities: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell'] },
            { code: 'NY', name: 'New York', cities: ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'New Rochelle', 'Mount Vernon', 'Schenectady', 'Utica'] },
            { code: 'NC', name: 'North Carolina', cities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'] },
            { code: 'ND', name: 'North Dakota', cities: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo'] },
            { code: 'OH', name: 'Ohio', cities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'] },
            { code: 'OK', name: 'Oklahoma', cities: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Lawton'] },
            { code: 'OR', name: 'Oregon', cities: ['Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro'] },
            { code: 'PA', name: 'Pennsylvania', cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'] },
            { code: 'RI', name: 'Rhode Island', cities: ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence'] },
            { code: 'SC', name: 'South Carolina', cities: ['Columbia', 'Charleston', 'North Charleston', 'Mount Pleasant', 'Rock Hill'] },
            { code: 'SD', name: 'South Dakota', cities: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown'] },
            { code: 'TN', name: 'Tennessee', cities: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville'] },
            { code: 'TX', name: 'Texas', cities: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Lubbock'] },
            { code: 'UT', name: 'Utah', cities: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem'] },
            { code: 'VT', name: 'Vermont', cities: ['Burlington', 'Essex', 'South Burlington', 'Colchester', 'Rutland'] },
            { code: 'VA', name: 'Virginia', cities: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News'] },
            { code: 'WA', name: 'Washington', cities: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'] },
            { code: 'WV', name: 'West Virginia', cities: ['Charleston', 'Huntington', 'Parkersburg', 'Morgantown', 'Wheeling'] },
            { code: 'WI', name: 'Wisconsin', cities: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine'] },
            { code: 'WY', name: 'Wyoming', cities: ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs'] }
        ]
    },
    {
        code: 'CA',
        name: 'Canada',
        states: [
            { code: 'ON', name: 'Ontario', cities: ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Markham', 'Vaughan', 'Kitchener', 'Windsor'] },
            { code: 'BC', name: 'British Columbia', cities: ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Abbotsford', 'Coquitlam', 'Saanich', 'Delta', 'Kelowna', 'Langley'] },
            { code: 'AB', name: 'Alberta', cities: ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'St. Albert', 'Medicine Hat', 'Grande Prairie', 'Airdrie', 'Spruce Grove', 'Leduc'] },
            { code: 'QC', name: 'Quebec', cities: ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay', 'Levis', 'Trois-Rivieres', 'Terrebonne'] },
            { code: 'MB', name: 'Manitoba', cities: ['Winnipeg', 'Brandon', 'Steinbach', 'Thompson', 'Portage la Prairie'] },
            { code: 'SK', name: 'Saskatchewan', cities: ['Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw', 'Swift Current'] },
            { code: 'NS', name: 'Nova Scotia', cities: ['Halifax', 'Sydney', 'Dartmouth', 'Truro', 'New Glasgow'] },
            { code: 'NB', name: 'New Brunswick', cities: ['Saint John', 'Moncton', 'Fredericton', 'Dieppe', 'Riverview'] },
            { code: 'NL', name: 'Newfoundland and Labrador', cities: ['St. John\'s', 'Mount Pearl', 'Conception Bay South', 'Corner Brook', 'Grand Falls-Windsor'] },
            { code: 'PE', name: 'Prince Edward Island', cities: ['Charlottetown', 'Summerside', 'Stratford', 'Cornwall', 'Montague'] },
            { code: 'NT', name: 'Northwest Territories', cities: ['Yellowknife', 'Hay River', 'Inuvik', 'Fort Smith', 'Behchoko'] },
            { code: 'YT', name: 'Yukon', cities: ['Whitehorse', 'Dawson City', 'Watson Lake', 'Haines Junction', 'Carmacks'] },
            { code: 'NU', name: 'Nunavut', cities: ['Iqaluit', 'Rankin Inlet', 'Arviat', 'Baker Lake', 'Cambridge Bay'] }
        ]
    },
    {
        code: 'MX',
        name: 'Mexico',
        states: [
            { code: 'MEX', name: 'Mexico City', cities: ['Mexico City', 'Iztapalapa', 'Gustavo A. Madero', 'Alvaro Obregon', 'Coyoacan'] },
            { code: 'JAL', name: 'Jalisco', cities: ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonala', 'Puerto Vallarta'] },
            { code: 'NLE', name: 'Nuevo Leon', cities: ['Monterrey', 'Guadalupe', 'San Nicolas de los Garza', 'Apodaca', 'Escobedo'] },
            { code: 'PUE', name: 'Puebla', cities: ['Puebla', 'Tehuacan', 'San Martin Texmelucan', 'Atlixco', 'San Pedro Cholula'] },
            { code: 'YUC', name: 'Yucatan', cities: ['Merida', 'Valladolid', 'Progreso', 'Tizimin', 'Motul'] }
        ]
    },

    // Europe
    {
        code: 'GB',
        name: 'United Kingdom',
        states: [
            { code: 'ENG', name: 'England', cities: ['London', 'Birmingham', 'Manchester', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Nottingham', 'Leicester', 'Coventry'] },
            { code: 'SCT', name: 'Scotland', cities: ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Stirling', 'Perth', 'Inverness', 'Dumfries', 'Ayr', 'Falkirk'] },
            { code: 'WLS', name: 'Wales', cities: ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry', 'Caerphilly', 'Rhondda', 'Merthyr Tydfil', 'Bridgend', 'Port Talbot'] },
            { code: 'NIR', name: 'Northern Ireland', cities: ['Belfast', 'Derry', 'Lisburn', 'Newtownabbey', 'Bangor', 'Craigavon', 'Castlereagh', 'Newry', 'Carrickfergus', 'Antrim'] }
        ]
    },
    {
        code: 'DE',
        name: 'Germany',
        states: [
            { code: 'BY', name: 'Bavaria', cities: ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg', 'Würzburg', 'Ingolstadt', 'Fürth', 'Erlangen', 'Bayreuth', 'Bamberg'] },
            { code: 'NW', name: 'North Rhine-Westphalia', cities: ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster'] },
            { code: 'BW', name: 'Baden-Württemberg', cities: ['Stuttgart', 'Mannheim', 'Karlsruhe', 'Freiburg', 'Heidelberg', 'Heilbronn', 'Ulm', 'Pforzheim', 'Reutlingen', 'Tübingen'] },
            { code: 'BE', name: 'Berlin', cities: ['Berlin'] },
            { code: 'HH', name: 'Hamburg', cities: ['Hamburg'] },
            { code: 'HB', name: 'Bremen', cities: ['Bremen', 'Bremerhaven'] }
        ]
    },
    {
        code: 'FR',
        name: 'France',
        states: [
            { code: 'IDF', name: 'Île-de-France', cities: ['Paris', 'Boulogne-Billancourt', 'Saint-Denis', 'Argenteuil', 'Montreuil', 'Nanterre', 'Vitry-sur-Seine', 'Créteil', 'Dunkerque', 'Nantes'] },
            { code: 'ARA', name: 'Auvergne-Rhône-Alpes', cities: ['Lyon', 'Saint-Étienne', 'Grenoble', 'Villeurbanne', 'Clermont-Ferrand', 'Annecy', 'Valence', 'Chambéry', 'Le Puy-en-Velay', 'Roanne'] },
            { code: 'PACA', name: 'Provence-Alpes-Côte d\'Azur', cities: ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Avignon', 'Antibes', 'Cannes', 'La Seyne-sur-Mer', 'Hyères', 'Fréjus'] },
            { code: 'HDF', name: 'Hauts-de-France', cities: ['Lille', 'Amiens', 'Roubaix', 'Tourcoing', 'Dunkerque', 'Calais', 'Boulogne-sur-Mer', 'Valenciennes', 'Lens', 'Arras'] },
            { code: 'GES', name: 'Grand Est', cities: ['Strasbourg', 'Reims', 'Metz', 'Mulhouse', 'Nancy', 'Colmar', 'Troyes', 'Charleville-Mézières', 'Châlons-en-Champagne', 'Épinal'] }
        ]
    },
    {
        code: 'IT',
        name: 'Italy',
        states: [
            { code: 'LAZ', name: 'Lazio', cities: ['Rome', 'Latina', 'Guidonia Montecelio', 'Fiumicino', 'Viterbo'] },
            { code: 'LOM', name: 'Lombardy', cities: ['Milan', 'Bergamo', 'Brescia', 'Monza', 'Como'] },
            { code: 'CAM', name: 'Campania', cities: ['Naples', 'Salerno', 'Torre del Greco', 'Giugliano in Campania', 'Casoria'] },
            { code: 'SIC', name: 'Sicily', cities: ['Palermo', 'Catania', 'Messina', 'Syracuse', 'Marsala'] },
            { code: 'VEN', name: 'Veneto', cities: ['Venice', 'Verona', 'Padua', 'Vicenza', 'Treviso'] }
        ]
    },
    {
        code: 'ES',
        name: 'Spain',
        states: [
            { code: 'MAD', name: 'Madrid', cities: ['Madrid', 'Alcalá de Henares', 'Móstoles', 'Fuenlabrada', 'Leganés'] },
            { code: 'CAT', name: 'Catalonia', cities: ['Barcelona', 'L\'Hospitalet de Llobregat', 'Terrassa', 'Badalona', 'Sabadell'] },
            { code: 'AND', name: 'Andalusia', cities: ['Seville', 'Málaga', 'Córdoba', 'Granada', 'Jerez de la Frontera'] },
            { code: 'VAL', name: 'Valencia', cities: ['Valencia', 'Alicante', 'Elche', 'Castellón de la Plana', 'Torrevieja'] },
            { code: 'GAL', name: 'Galicia', cities: ['Vigo', 'A Coruña', 'Ourense', 'Lugo', 'Santiago de Compostela'] }
        ]
    },
    {
        code: 'NL',
        name: 'Netherlands',
        states: [
            { code: 'NH', name: 'North Holland', cities: ['Amsterdam', 'Haarlem', 'Zaanstad', 'Hilversum', 'Amstelveen'] },
            { code: 'ZH', name: 'South Holland', cities: ['Rotterdam', 'The Hague', 'Leiden', 'Dordrecht', 'Zoetermeer'] },
            { code: 'UT', name: 'Utrecht', cities: ['Utrecht', 'Amersfoort', 'Nieuwegein', 'Veenendaal', 'Zeist'] },
            { code: 'GE', name: 'Gelderland', cities: ['Nijmegen', 'Arnhem', 'Apeldoorn', 'Ede', 'Doetinchem'] },
            { code: 'OV', name: 'Overijssel', cities: ['Enschede', 'Zwolle', 'Deventer', 'Almelo', 'Hengelo'] }
        ]
    },

    // Asia
    {
        code: 'CN',
        name: 'China',
        states: [
            { code: 'BJ', name: 'Beijing', cities: ['Beijing', 'Chaoyang', 'Haidian', 'Fengtai', 'Shijingshan', 'Mentougou', 'Fangshan', 'Tongzhou', 'Shunyi', 'Changping'] },
            { code: 'SH', name: 'Shanghai', cities: ['Shanghai', 'Pudong', 'Huangpu', 'Xuhui', 'Changning', 'Jing\'an', 'Putuo', 'Hongkou', 'Yangpu', 'Minhang'] },
            { code: 'GD', name: 'Guangdong', cities: ['Guangzhou', 'Shenzhen', 'Dongguan', 'Foshan', 'Zhongshan', 'Huizhou', 'Jiangmen', 'Zhuhai', 'Shantou', 'Zhanjiang'] },
            { code: 'JS', name: 'Jiangsu', cities: ['Nanjing', 'Suzhou', 'Wuxi', 'Changzhou', 'Nantong', 'Yangzhou', 'Zhenjiang', 'Taizhou', 'Suqian', 'Huai\'an'] },
            { code: 'ZJ', name: 'Zhejiang', cities: ['Hangzhou', 'Ningbo', 'Wenzhou', 'Jiaxing', 'Huzhou', 'Shaoxing', 'Jinhua', 'Quzhou', 'Zhoushan', 'Taizhou'] }
        ]
    },
    {
        code: 'JP',
        name: 'Japan',
        states: [
            { code: '13', name: 'Tokyo', cities: ['Tokyo', 'Shibuya', 'Shinjuku', 'Ikebukuro', 'Ueno', 'Asakusa', 'Harajuku', 'Ginza', 'Roppongi', 'Akihabara'] },
            { code: '27', name: 'Osaka', cities: ['Osaka', 'Sakai', 'Higashiosaka', 'Toyonaka', 'Hirakata', 'Neyagawa', 'Suita', 'Yao', 'Ibaraki', 'Moriguchi'] },
            { code: '14', name: 'Kanagawa', cities: ['Yokohama', 'Kawasaki', 'Sagamihara', 'Fujisawa', 'Yokosuka', 'Chigasaki', 'Atsugi', 'Yamato', 'Odawara', 'Zama'] },
            { code: '23', name: 'Aichi', cities: ['Nagoya', 'Toyota', 'Okazaki', 'Ichinomiya', 'Seto', 'Handa', 'Kasugai', 'Toyohashi', 'Anjo', 'Kariya'] },
            { code: '12', name: 'Chiba', cities: ['Chiba', 'Funabashi', 'Matsudo', 'Ichikawa', 'Kashiwa', 'Narashino', 'Sakura', 'Yachiyo', 'Abiko', 'Kamagaya'] }
        ]
    },
    {
        code: 'IN',
        name: 'India',
        states: [
            // States
            { code: 'AP', name: 'Andhra Pradesh', cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Kadapa', 'Anantapur', 'Chittoor', 'Rajahmundry', 'Kakinada', 'Vizianagaram', 'Srikakulam', 'Eluru', 'Ongole', 'Nandyal', 'Machilipatnam', 'Adoni', 'Tenali', 'Chilakaluripet'] },
            { code: 'AR', name: 'Arunachal Pradesh', cities: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezpur', 'Dibrugarh', 'Jorhat', 'Tinsukia', 'Sivasagar', 'North Lakhimpur', 'Barpeta', 'Bongaigaon', 'Goalpara', 'Dhubri', 'Kokrajhar', 'Baksa', 'Chirang', 'Udalguri', 'Sonitpur', 'Lakhimpur', 'Dhemaji'] },
            { code: 'AS', name: 'Assam', cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Tinsukia', 'Sivasagar', 'North Lakhimpur', 'Barpeta', 'Bongaigaon', 'Goalpara', 'Dhubri', 'Kokrajhar', 'Baksa', 'Chirang', 'Udalguri', 'Sonitpur', 'Lakhimpur', 'Dhemaji', 'Nagaon', 'Morigaon'] },
            { code: 'BR', name: 'Bihar', cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chapra', 'Sasaram', 'Hajipur', 'Siwan', 'Motihari', 'Nalanda', 'Bettiah', 'Kishanganj', 'Saharsa', 'Madhepura'] },
            { code: 'CT', name: 'Chhattisgarh', cities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Durg', 'Raigarh', 'Jagdalpur', 'Ambikapur', 'Dhamtari', 'Mahasamund', 'Kanker', 'Kawardha', 'Janjgir-Champa', 'Mungeli', 'Surajpur', 'Balrampur', 'Sukma', 'Kondagaon', 'Gariaband'] },
            { code: 'GA', name: 'Goa', cities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Mormugao', 'Bicholim', 'Pernem', 'Sanguem', 'Quepem', 'Canacona', 'Curchorem', 'Sanquelim', 'Valpoi', 'Cuncolim', 'Cavelossim', 'Benaulim', 'Colva', 'Calangute', 'Candolim'] },
            { code: 'GJ', name: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Nadiad', 'Morbi', 'Bharuch', 'Anand', 'Navsari', 'Valsad', 'Palanpur', 'Mehsana', 'Bhuj', 'Gandhidham', 'Veraval', 'Porbandar'] },
            { code: 'HR', name: 'Haryana', cities: ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind', 'Kaithal', 'Rewari', 'Palwal', 'Thanesar', 'Narnaul', 'Fatehabad'] },
            { code: 'HP', name: 'Himachal Pradesh', cities: ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Palampur', 'Kullu', 'Manali', 'Chamba', 'Una', 'Hamirpur', 'Baddi', 'Nahan', 'Kangra', 'Bilaspur', 'Kasauli', 'Dalhousie', 'Kufri', 'McLeod Ganj', 'Parwanoo', 'Rampur'] },
            { code: 'JH', name: 'Jharkhand', cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Phusro', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar', 'Chatra', 'Koderma', 'Pakur', 'Sahebganj', 'Dumka', 'Jamtara', 'Sahibganj', 'Latehar', 'Palamu', 'Garhwa'] },
            { code: 'KA', name: 'Karnataka', cities: ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere', 'Bellary', 'Bijapur', 'Shimoga', 'Tumkur', 'Raichur', 'Bidar', 'Hospet', 'Hassan', 'Gadag', 'Udupi', 'Chitradurga', 'Kolar', 'Mandya'] },
            { code: 'KL', name: 'Kerala', cities: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Malappuram', 'Kannur', 'Kasaragod', 'Alappuzha', 'Pathanamthitta', 'Kottayam', 'Idukki', 'Ernakulam', 'Wayanad', 'Manjeri', 'Thalassery', 'Koyilandy', 'Neyyattinkara', 'Kayamkulam'] },
            { code: 'MP', name: 'Madhya Pradesh', cities: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Morena', 'Bhind', 'Guna', 'Shivpuri', 'Vidisha', 'Chhindwara'] },
            { code: 'MH', name: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Sangli', 'Malegaon', 'Jalgaon', 'Akola', 'Latur', 'Ahmadnagar', 'Dhule', 'Ichalkaranji', 'Parbhani', 'Jalna', 'Bhusawal'] },
            { code: 'MN', name: 'Manipur', cities: ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Senapati', 'Tamenglong', 'Chandel', 'Ukhrul', 'Kakching', 'Jiribam', 'Noney', 'Pherzawl', 'Kangpokpi', 'Kamjong', 'Tengnoupal', 'Lilong', 'Mayang Imphal', 'Lamlai', 'Sekmai', 'Wangjing'] },
            { code: 'ML', name: 'Meghalaya', cities: ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Williamnagar', 'Baghmara', 'Resubelpara', 'Ampati', 'Mairang', 'Mawkyrwat', 'Nongpoh', 'Khliehriat', 'Mawphlang', 'Sohra', 'Mawryngkneng', 'Pynursla', 'Mawshynrut', 'Rongjeng', 'Mendipathar', 'Dadenggiri'] },
            { code: 'MZ', name: 'Mizoram', cities: ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Serchhip', 'Lawngtlai', 'Mamit', 'Saitual', 'Hnahthial', 'Khawzawl', 'Saitual', 'Darlawn', 'Tlabung', 'Vairengte', 'Bilkhawthlir', 'Thingsulthliah', 'Reiek', 'Thenzawl', 'Phullen'] },
            { code: 'NL', name: 'Nagaland', cities: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Phek', 'Mon', 'Kiphire', 'Longleng', 'Peren', 'Noklak', 'Shamator', 'Tseminyu', 'Niuland', 'Chumukedima', 'Medziphema', 'Jalukie', 'Pfutsero', 'Meluri'] },
            { code: 'OR', name: 'Odisha', cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Bargarh', 'Jharsuguda', 'Kendujhar', 'Mayurbhanj', 'Koraput', 'Rayagada', 'Malkangiri', 'Nabarangpur', 'Nuapada', 'Kalahandi', 'Bolangir'] },
            { code: 'PB', name: 'Punjab', cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Firozpur', 'Batala', 'Pathankot', 'Moga', 'Abohar', 'Malerkotla', 'Khanna', 'Phagwara', 'Muktsar', 'Barnala', 'Rajpura', 'Fazilka', 'Kapurthala', 'Sangrur'] },
            { code: 'RJ', name: 'Rajasthan', cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bharatpur', 'Alwar', 'Bhilwara', 'Ganganagar', 'Sikar', 'Pali', 'Tonk', 'Kishangarh', 'Beawar', 'Hanumangarh', 'Dungarpur', 'Chittorgarh', 'Banswara', 'Sawai Madhopur'] },
            { code: 'SK', name: 'Sikkim', cities: ['Gangtok', 'Namchi', 'Mangan', 'Gyalshing', 'Singtam', 'Rangpo', 'Jorethang', 'Ravangla', 'Pelling', 'Lachen', 'Lachung', 'Yuksom', 'Zuluk', 'Rhenock', 'Rongli', 'Pakhyong', 'Soreng', 'Chungthang', 'Dzongu', 'Kabi'] },
            { code: 'TN', name: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukkudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur', 'Nagercoil', 'Kanchipuram', 'Cuddalore'] },
            { code: 'TG', name: 'Telangana', cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Siddipet', 'Jagtial', 'Mancherial', 'Nirmal', 'Kamareddy', 'Sangareddy', 'Medak', 'Bhongir', 'Bodhan'] },
            { code: 'TR', name: 'Tripura', cities: ['Agartala', 'Dharmanagar', 'Udaipur', 'Ambassa', 'Kailashahar', 'Belonia', 'Khowai', 'Teliamura', 'Sabroom', 'Sonamura', 'Kamalpur', 'Amarpur', 'Kumarghat', 'Jirania', 'Melaghar', 'Santirbazar', 'Bishalgarh', 'Dukli', 'Jampuijala', 'Mohanpur'] },
            { code: 'UP', name: 'Uttar Pradesh', cities: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut', 'Varanasi', 'Allahabad', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Shahjahanpur', 'Mathura', 'Shamli', 'Hapur', 'Rampur'] },
            { code: 'UK', name: 'Uttarakhand', cities: ['Dehradun', 'Haridwar', 'Roorkee', 'Kashipur', 'Rudrapur', 'Haldwani', 'Rishikesh', 'Kotdwar', 'Ramnagar', 'Pithoragarh', 'Manglaur', 'Nainital', 'Mussoorie', 'Almora', 'Bageshwar', 'Champawat', 'Pauri', 'Chamoli', 'Uttarkashi', 'Tehri'] },
            { code: 'WB', name: 'West Bengal', cities: ['Kolkata', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda', 'Bahraich', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Dhulian', 'Ranaghat', 'Haldia', 'Raiganj', 'Krishnanagar', 'Nabadwip', 'Medinipur', 'Jalpaiguri', 'Balurghat'] },
            
            // Union Territories
            { code: 'AN', name: 'Andaman and Nicobar Islands', cities: ['Port Blair', 'Diglipur', 'Mayabunder', 'Rangat', 'Hut Bay', 'Car Nicobar', 'Nancowry', 'Katchal', 'Kamorta', 'Teressa', 'Chowra', 'Pulomilo', 'Little Andaman', 'Baratang', 'Wandoor', 'Chidiyatapu', 'Mount Harriet', 'Ross Island', 'Viper Island', 'Jolly Buoy'] },
            { code: 'CH', name: 'Chandigarh', cities: ['Chandigarh', 'Manimajra', 'Daria', 'Kaimbwala', 'Kharar', 'Zirakpur', 'Panchkula', 'Mohali', 'Kalka', 'Pinjore', 'Baddi', 'Nalagarh', 'Parwanoo', 'Solan', 'Barog', 'Kasauli', 'Dharampur', 'Kumarhatti', 'Sabathu', 'Dagshai'] },
            { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu', cities: ['Silvassa', 'Daman', 'Diu', 'Naroli', 'Khanvel', 'Masat', 'Amli', 'Dadra', 'Nagar Haveli', 'Vapi', 'Bilimora', 'Valsad', 'Navsari', 'Surat', 'Bharuch', 'Ankleshwar', 'Bardoli', 'Vyara', 'Songadh', 'Mahuva'] },
            { code: 'DL', name: 'Delhi', cities: ['New Delhi', 'Central Delhi', 'East Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi', 'Dwarka', 'Rohini', 'Pitampura', 'Janakpuri', 'Lajpat Nagar', 'Karol Bagh', 'Connaught Place', 'CP', 'Rajouri Garden'] },
            { code: 'JK', name: 'Jammu and Kashmir', cities: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Kathua', 'Udhampur', 'Poonch', 'Rajouri', 'Kupwara', 'Bandipora', 'Ganderbal', 'Shopian', 'Kulgam', 'Pulwama', 'Budgam', 'Kishtwar', 'Doda', 'Ramban', 'Reasi'] },
            { code: 'LA', name: 'Ladakh', cities: ['Leh', 'Kargil', 'Drass', 'Zanskar', 'Nubra', 'Changthang', 'Suru', 'Wakha', 'Sham', 'Rong', 'Turtuk', 'Hunder', 'Diskit', 'Sumur', 'Panamik', 'Tegar', 'Chumathang', 'Nyoma', 'Durbuk', 'Tangtse'] },
            { code: 'LD', name: 'Lakshadweep', cities: ['Kavaratti', 'Agatti', 'Amini', 'Andrott', 'Bitra', 'Chetlat', 'Kadmat', 'Kalpeni', 'Kiltan', 'Minicoy', 'Bangaram', 'Thinnakara', 'Parali', 'Suheli', 'Cheriyam', 'Pitti', 'Byramgore', 'Cora Divh', 'Sesostris Bank', 'Bassas de Pedro'] },
            { code: 'PY', name: 'Puducherry', cities: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam', 'Ozhukarai', 'Villianur', 'Bahour', 'Mannadipet', 'Nettapakkam', 'Ariyankuppam', 'Mudaliarpet', 'Kalapet', 'Embalam', 'Kurumbapet', 'Reddiarpalayam', 'Lawspet', 'Muthialpet', 'Sainte Marie', 'White Town', 'French Quarter'] }
        ]
    },
    {
        code: 'KR',
        name: 'South Korea',
        states: [
            { code: '11', name: 'Seoul', cities: ['Seoul', 'Gangnam', 'Gangbuk', 'Gangdong', 'Gangseo', 'Gwanak', 'Gwangjin', 'Guro', 'Geumcheon', 'Nowon'] },
            { code: '26', name: 'Busan', cities: ['Busan', 'Haeundae', 'Saha', 'Sasang', 'Saha', 'Dong', 'Jung', 'Nam', 'Busanjin', 'Dongnae'] },
            { code: '27', name: 'Daegu', cities: ['Daegu', 'Jung', 'Dong', 'Seo', 'Nam', 'Buk', 'Suseong', 'Dalseo', 'Dalseong', 'Gunwi'] },
            { code: '28', name: 'Incheon', cities: ['Incheon', 'Jung', 'Dong', 'Michuhol', 'Yeonsu', 'Namdong', 'Bupyeong', 'Gyeyang', 'Seo', 'Ganghwa'] },
            { code: '29', name: 'Gwangju', cities: ['Gwangju', 'Dong', 'Seo', 'Nam', 'Buk', 'Gwangsan'] }
        ]
    },

    // Oceania
    {
        code: 'AU',
        name: 'Australia',
        states: [
            { code: 'NSW', name: 'New South Wales', cities: ['Sydney', 'Newcastle', 'Wollongong', 'Maitland', 'Albury', 'Wagga Wagga', 'Tamworth', 'Orange', 'Dubbo', 'Nowra'] },
            { code: 'VIC', name: 'Victoria', cities: ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Shepparton', 'Warrnambool', 'Mildura', 'Traralgon', 'Frankston', 'Dandenong'] },
            { code: 'QLD', name: 'Queensland', cities: ['Brisbane', 'Gold Coast', 'Townsville', 'Cairns', 'Toowoomba', 'Rockhampton', 'Mackay', 'Bundaberg', 'Hervey Bay', 'Gladstone'] },
            { code: 'WA', name: 'Western Australia', cities: ['Perth', 'Fremantle', 'Rockingham', 'Mandurah', 'Bunbury', 'Geraldton', 'Albany', 'Broome', 'Kalgoorlie', 'Port Hedland'] },
            { code: 'SA', name: 'South Australia', cities: ['Adelaide', 'Mount Gambier', 'Whyalla', 'Murray Bridge', 'Port Augusta', 'Port Pirie', 'Port Lincoln', 'Gawler', 'Victor Harbor', 'Kadina'] }
        ]
    },
    {
        code: 'NZ',
        name: 'New Zealand',
        states: [
            { code: 'AUK', name: 'Auckland', cities: ['Auckland', 'Manukau', 'North Shore', 'Waitakere', 'Papakura', 'Franklin', 'Rodney'] },
            { code: 'WGN', name: 'Wellington', cities: ['Wellington', 'Lower Hutt', 'Upper Hutt', 'Porirua', 'Kapiti Coast', 'Masterton', 'Carterton', 'South Wairarapa'] },
            { code: 'CAN', name: 'Canterbury', cities: ['Christchurch', 'Timaru', 'Ashburton', 'Rangiora', 'Kaiapoi', 'Rolleston', 'Lincoln', 'Leeston'] },
            { code: 'WAI', name: 'Waikato', cities: ['Hamilton', 'Tauranga', 'Rotorua', 'Taupo', 'Cambridge', 'Te Awamutu', 'Matamata', 'Morrinsville'] },
            { code: 'BAY', name: 'Bay of Plenty', cities: ['Tauranga', 'Rotorua', 'Whakatane', 'Taupo', 'Kawerau', 'Opotiki', 'Te Puke', 'Murupara'] }
        ]
    },

    // South America
    {
        code: 'BR',
        name: 'Brazil',
        states: [
            { code: 'SP', name: 'São Paulo', cities: ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'Osasco', 'Ribeirão Preto', 'Sorocaba', 'Mauá', 'São José dos Campos'] },
            { code: 'RJ', name: 'Rio de Janeiro', cities: ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Belford Roxo', 'São João de Meriti', 'Campos dos Goytacazes', 'Petrópolis', 'Volta Redonda'] },
            { code: 'MG', name: 'Minas Gerais', cities: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga'] },
            { code: 'RS', name: 'Rio Grande do Sul', cities: ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria', 'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande'] },
            { code: 'PR', name: 'Paraná', cities: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá'] }
        ]
    },
    {
        code: 'AR',
        name: 'Argentina',
        states: [
            { code: 'C', name: 'Buenos Aires', cities: ['Buenos Aires', 'La Plata', 'Mar del Plata', 'Quilmes', 'Almirante Brown', 'Merlo', 'Lanús', 'General San Martín', 'Moreno', 'Tres de Febrero'] },
            { code: 'X', name: 'Córdoba', cities: ['Córdoba', 'Villa María', 'Río Cuarto', 'San Francisco', 'Villa Carlos Paz', 'Río Tercero', 'Marcos Juárez', 'Villa Allende', 'Jesús María', 'Unquillo'] },
            { code: 'M', name: 'Mendoza', cities: ['Mendoza', 'San Rafael', 'Godoy Cruz', 'Las Heras', 'Luján de Cuyo', 'Maipú', 'Tunuyán', 'San Martín', 'Rivadavia', 'Junín'] },
            { code: 'S', name: 'Santa Fe', cities: ['Santa Fe', 'Rosario', 'Villa Gobernador Gálvez', 'San Lorenzo', 'Rafaela', 'Villa Constitución', 'Reconquista', 'Santo Tomé', 'Venado Tuerto', 'Esperanza'] }
        ]
    },

    // Africa
    {
        code: 'ZA',
        name: 'South Africa',
        states: [
            { code: 'GP', name: 'Gauteng', cities: ['Johannesburg', 'Pretoria', 'Soweto', 'Tembisa', 'Benoni', 'Vereeniging', 'Kempton Park', 'Boksburg', 'Germiston', 'Randburg'] },
            { code: 'WC', name: 'Western Cape', cities: ['Cape Town', 'Paarl', 'Stellenbosch', 'George', 'Mossel Bay', 'Oudtshoorn', 'Worcester', 'Knysna', 'Hermanus', 'Saldanha'] },
            { code: 'KZN', name: 'KwaZulu-Natal', cities: ['Durban', 'Pietermaritzburg', 'Newcastle', 'Ladysmith', 'Richards Bay', 'Pinetown', 'Umlazi', 'Chatsworth', 'Phoenix', 'KwaMashu'] },
            { code: 'EC', name: 'Eastern Cape', cities: ['Port Elizabeth', 'East London', 'Uitenhage', 'King Williams Town', 'Queenstown', 'Grahamstown', 'Jeffreys Bay', 'Port Alfred', 'Graaff-Reinet', 'Cradock'] }
        ]
    },
    {
        code: 'NG',
        name: 'Nigeria',
        states: [
            { code: 'LA', name: 'Lagos', cities: ['Lagos', 'Ikeja', 'Surulere', 'Mushin', 'Oshodi', 'Agege', 'Alimosho', 'Kosofe', 'Ajeromi-Ifelodun', 'Amuwo-Odofin'] },
            { code: 'FC', name: 'Abuja', cities: ['Abuja', 'Gwagwalada', 'Kuje', 'Bwari', 'Kwali', 'Abaji', 'Municipal Area Council', 'Garki', 'Wuse', 'Asokoro'] },
            { code: 'RI', name: 'Rivers', cities: ['Port Harcourt', 'Obio-Akpor', 'Okrika', 'Ogu–Bolo', 'Eleme', 'Tai', 'Gokana', 'Khana', 'Oyigbo', 'Opobo–Nkoro'] },
            { code: 'AN', name: 'Anambra', cities: ['Awka', 'Onitsha', 'Nnewi', 'Aguata', 'Idemili North', 'Idemili South', 'Njikoka', 'Anaocha', 'Orumba North', 'Orumba South'] }
        ]
    },

    // Middle East
    {
        code: 'AE',
        name: 'United Arab Emirates',
        states: [
            { code: 'DU', name: 'Dubai', cities: ['Dubai', 'Jumeirah', 'Marina', 'Downtown', 'Business Bay', 'JBR', 'Palm Jumeirah', 'Dubai Hills', 'Dubai Sports City', 'Dubai Silicon Oasis'] },
            { code: 'AD', name: 'Abu Dhabi', cities: ['Abu Dhabi', 'Al Ain', 'Liwa', 'Ruwais', 'Madinat Zayed', 'Ghayathi', 'Delma Island', 'Sir Bani Yas', 'Marawah', 'Das Island'] },
            { code: 'SH', name: 'Sharjah', cities: ['Sharjah', 'Al Dhaid', 'Kalba', 'Khor Fakkan', 'Dibba Al-Hisn', 'Al Madam', 'Al Bataeh', 'Al Hamriyah', 'Mleiha', 'Al Qasimiya'] },
            { code: 'AJ', name: 'Ajman', cities: ['Ajman', 'Al Nuaimiya', 'Al Rawda', 'Al Rashidiya', 'Al Mowaihat', 'Al Jerf', 'Al Hamidiya', 'Al Bustan', 'Al Rawda 2', 'Al Nuaimiya 2'] }
        ]
    },
    {
        code: 'SA',
        name: 'Saudi Arabia',
        states: [
            { code: '01', name: 'Riyadh', cities: ['Riyadh', 'Diriyah', 'Al Kharj', 'Al Majma\'ah', 'Al Zulfi', 'Al Ghat', 'Al Duwadimi', 'Al Quway\'iyah', 'Al Aflaj', 'Al Sulayyil'] },
            { code: '02', name: 'Makkah', cities: ['Mecca', 'Jeddah', 'Ta\'if', 'Al Qunfudhah', 'Al Lith', 'Rabigh', 'Al Jumum', 'Khulays', 'Al Khurmah', 'Ranyah'] },
            { code: '03', name: 'Al Madinah', cities: ['Medina', 'Yanbu', 'Al Ula', 'Badr', 'Khaybar', 'Al Henakiyah', 'Al Mahd', 'Al Mastourah', 'Al Silayil', 'Al Suwairqiyah'] },
            { code: '04', name: 'Eastern Province', cities: ['Dammam', 'Al Khobar', 'Dhahran', 'Jubail', 'Qatif', 'Al Ahsa', 'Ras Tanura', 'Al Qatif', 'Al Khafji', 'Al Nairyah'] }
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

