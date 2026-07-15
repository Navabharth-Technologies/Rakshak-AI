import { useState, useMemo, useEffect } from 'react';
import { Map, AlertTriangle, Shield, Thermometer, Crosshair, Users, CheckCircle, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useToastStore } from '../store/toastStore';
import { useCaseStore } from '../store/caseStore';
import { useThemeStore } from '../store/themeStore';

const MAP_CENTER: [number, number] = [14.0, 75.7139];
const ZOOM_LEVEL = 7;

// ---------- Geocoding helpers ----------
const KARNATAKA_LOCATION_COORDS: Record<string, [number, number]> = {
  // Localities & landmarks
  'ramakrishna nagar': [12.2828, 76.6235], 'ramakrishnagar': [12.2828, 76.6235],
  'agrahara': [12.2985, 76.6521], 'mysuru central': [12.3058, 76.6553],
  'vijayanagar': [12.9560, 77.5350], 'hebbal': [13.0354, 77.5988],
  'koramangala': [12.9352, 77.6245], 'jayanagar': [12.9308, 77.5831],
  'jp nagar': [12.9107, 77.5857], 'indiranagar': [12.9784, 77.6408],
  'whitefield': [12.9698, 77.7499], 'electronic city': [12.8399, 77.6770],
  'om beach': [14.7133, 74.3183], 'gokarna': [14.5479, 74.3188],
  'malpe beach': [13.3533, 74.6938], 'panambur beach': [12.9636, 74.8060],
  'madikeri': [12.4244, 75.7382], 'karwar': [14.8136, 74.1285],
  // Districts
  'bengaluru': [12.9716, 77.5946], 'bangalore': [12.9716, 77.5946],
  'bengaluru urban': [12.9716, 77.5946], 'bengaluru rural': [13.1986, 77.5682],
  'mysuru': [12.2958, 76.6394], 'mysore': [12.2958, 76.6394],
  'hubballi': [15.3647, 75.1240], 'hubli': [15.3647, 75.1240], 'hubballi-dharwad': [15.3647, 75.1240],
  'dharwad': [15.4589, 75.0078], 'mangaluru': [12.9141, 74.8560], 'mangalore': [12.9141, 74.8560],
  'dakshina kannada': [12.8700, 75.2479], 'belagavi': [15.8497, 74.4977], 'belgaum': [15.8497, 74.4977],
  'kalaburagi': [17.3297, 76.8343], 'gulbarga': [17.3297, 76.8343], 'davangere': [14.4644, 75.9218],
  'ballari': [15.1394, 76.9214], 'bellary': [15.1394, 76.9214],
  'tumakuru': [13.3379, 77.1173], 'tumkur': [13.3379, 77.1173],
  'shivamogga': [13.9299, 75.5681], 'shimoga': [13.9299, 75.5681],
  'vijayapura': [16.8302, 75.7100], 'bijapur': [16.8302, 75.7100],
  'raichur': [16.2120, 77.3566], 'udupi': [13.3409, 74.7421], 'hassan': [13.0068, 76.0996],
  'chikkamagaluru': [13.3161, 75.7720], 'chikmagalur': [13.3161, 75.7720],
  'kodagu': [12.4244, 75.7382], 'coorg': [12.4244, 75.7382],
  'mandya': [12.5218, 76.8951], 'chamarajanagar': [11.9261, 76.9437],
  'chikkaballapur': [13.4355, 77.7315], 'chitradurga': [14.2251, 76.4020],
  'gadag': [15.4316, 75.6269], 'koppal': [15.3474, 76.1547],
  'bagalkote': [16.1691, 75.6960], 'bagalkot': [16.1691, 75.6960],
  'bidar': [17.9104, 77.5199], 'yadgir': [16.7689, 77.1381], 'haveri': [14.7957, 75.4004],
  'uttara kannada': [14.9807, 74.5815], 'kolar': [13.1360, 78.1294],
  'ramanagara': [12.7161, 77.2820], 'vijayanagara': [15.1394, 76.9214],
  // Taluks — Bengaluru Urban
  'bengaluru north': [13.0827, 77.5878], 'bengaluru south': [12.9236, 77.5914],
  'bengaluru east': [12.9939, 77.6399], 'anekal': [12.7101, 77.6956],
  'yelahanka': [13.1005, 77.5963], 'dasarahalli': [13.0411, 77.5110],
  'bommanahalli': [12.9080, 77.6163], 'mahadevapura': [12.9827, 77.7029],
  'rajarajeshwari nagar': [12.8940, 77.4990], 'byatarayanapura': [13.0566, 77.5568],
  // Taluks — Bengaluru Rural
  'devanahalli': [13.2472, 77.7137], 'doddaballapura': [13.2969, 77.5359],
  'hosakote': [13.0707, 77.7956], 'nelamangala': [13.0988, 77.3937],
  // Taluks — Mysuru
  'mysuru taluk': [12.2958, 76.6394], 'nanjangud': [12.1135, 76.6848],
  'hunsur': [12.3008, 76.2901], 'heggadadevana kote': [11.9986, 76.3341],
  'piriyapatna': [12.3385, 76.1016], 'krishnarajanagara': [12.4175, 76.3861],
  't narasipur': [12.2132, 76.9000], 'h d kote': [11.9986, 76.3341],
  // Taluks — Mandya
  'mandya taluk': [12.5218, 76.8951], 'maddur': [12.5837, 77.0433],
  'malavalli': [12.3814, 77.0627], 'pandavapura': [12.4867, 76.6740],
  'srirangapatna': [12.4175, 76.6921], 'nagamangala': [12.8124, 76.7558],
  'krishnarajapete': [12.6673, 76.5019],
  // Taluks — Hassan
  'hassan taluk': [13.0068, 76.0996], 'arsikere': [13.3140, 76.2474],
  'belur': [13.1637, 75.8657], 'channarayapatna': [12.9044, 76.3874],
  'holenarasipur': [12.7832, 76.2376], 'sakleshpur': [12.9369, 75.7904],
  'arkalgud': [12.7619, 76.0521], 'alur': [13.0438, 75.9730],
  // Taluks — Dakshina Kannada (Mangaluru)
  'mangaluru taluk': [12.9141, 74.8560], 'bantwal': [12.8892, 75.0253],
  'beltangady': [12.9774, 75.3027], 'puttur': [12.7621, 75.2046],
  'sullia': [12.5568, 75.3850], 'kadaba': [12.6791, 75.2704],
  // Taluks — Udupi
  'udupi taluk': [13.3409, 74.7421], 'kundapur': [13.6219, 74.6908],
  'karkala': [13.2073, 74.9937], 'brahmavar': [13.4282, 74.7545],
  // Taluks — Shivamogga
  'shivamogga taluk': [13.9299, 75.5681], 'bhadravati': [13.8563, 75.7009],
  'hosanagara': [13.9002, 75.0521], 'sagara': [14.1702, 75.0269],
  'shikaripura': [14.2648, 75.3514], 'soraba': [14.3916, 75.0664],
  'thirthahalli': [13.6843, 75.2366],
  // Taluks — Chikkamagaluru
  'chikkamagaluru taluk': [13.3161, 75.7720], 'kadur': [13.5530, 76.0140],
  'koppa': [13.5232, 75.3606], 'mudigere': [13.1337, 75.6389],
  'n r pura': [13.5694, 75.1012], 'sringeri': [13.4195, 75.2557],
  'tarikere': [13.7135, 75.8156],
  // Taluks — Kodagu
  'madikeri taluk': [12.4244, 75.7382], 'virajpet': [11.8307, 75.8008],
  'somwarpet': [12.6012, 75.9800],
  // Taluks — Belagavi
  'belagavi taluk': [15.8497, 74.4977], 'athani': [16.7301, 75.0674],
  'bailhongal': [15.8138, 74.9716], 'chikodi': [16.4277, 74.5887],
  'gokak': [16.1670, 74.8290], 'hukkeri': [16.2278, 74.6020],
  'khanapur': [15.6406, 74.5073], 'mudalagi': [16.5430, 75.0620],
  'nippani': [16.4040, 74.3809], 'raibag': [16.4890, 74.7720],
  'ramdurg': [16.0011, 75.2937], 'savadatti': [15.7659, 75.1337],
  // Taluks — Dharwad
  'dharwad taluk': [15.4589, 75.0078], 'hubli taluk': [15.3647, 75.1240],
  'kalghatgi': [14.9660, 75.2030], 'navalgund': [15.5527, 75.3682],
  'kundgol': [15.2524, 75.2628],
  // Taluks — Gadag
  'gadag taluk': [15.4316, 75.6269], 'mundargi': [15.1834, 75.8775],
  'nargund': [15.7239, 75.3890], 'shirahatti': [14.9877, 75.5754],
  'ron': [15.6947, 75.7046],
  // Taluks — Haveri
  'haveri taluk': [14.7957, 75.4004], 'byadagi': [14.6696, 75.4834],
  'hanagal': [14.4449, 75.1219], 'hirekerur': [14.4560, 75.3910],
  'ranebennur': [14.6220, 75.6324], 'savanur': [14.9750, 75.3371],
  'shiggaon': [14.9869, 75.2230],
  // Taluks — Uttara Kannada
  'karwar taluk': [14.8136, 74.1285], 'ankola': [14.6590, 74.3132],
  'bhatkal': [13.9759, 74.5534], 'dandeli': [15.2645, 74.6235],
  'honnavar': [14.2779, 74.4479], 'joida': [15.1266, 74.3854],
  'kumta': [14.4280, 74.4187], 'mundgod': [14.9723, 75.0380],
  'siddapur': [14.3578, 74.8937], 'sirsi': [14.6204, 74.8350],
  'yellapur': [14.9672, 74.7143],
  // Taluks — Kalaburagi
  'kalaburagi taluk': [17.3297, 76.8343], 'afzalpur': [17.1986, 76.3625],
  'aland': [17.5597, 76.5631], 'chittapur': [17.1094, 76.9914],
  'chincholi': [17.4623, 77.4222], 'jevargi': [16.7511, 76.7726],
  'sedam': [17.1715, 77.2814], 'yadgir taluk': [16.7689, 77.1381],
  // Taluks — Bidar
  'bidar taluk': [17.9104, 77.5199], 'aurad': [17.5407, 77.3561],
  'basavakalyan': [17.8720, 76.9498], 'bhalki': [18.0416, 76.6857],
  'humnabad': [17.7727, 76.5543],
  // Taluks — Raichur
  'raichur taluk': [16.2120, 77.3566], 'devadurga': [16.3817, 77.0028],
  'lingsugur': [15.9768, 76.5197], 'manvi': [15.9888, 77.0528],
  'sindhanur': [15.7689, 76.7551],
  // Taluks — Koppal
  'koppal taluk': [15.3474, 76.1547], 'gangavathi': [15.4303, 76.5350],
  'kustagi': [15.7641, 76.1220], 'yelburga': [15.6264, 76.0039],
  // Taluks — Ballari
  'ballari taluk': [15.1394, 76.9214], 'hagaribommanahalli': [14.8937, 76.2067],
  'hospet': [15.2689, 76.3877], 'kudligi': [14.9048, 76.3837],
  'sandur': [15.0879, 76.5559], 'siruguppa': [15.6393, 76.9002],
  // Taluks — Vijayapura
  'vijayapura taluk': [16.8302, 75.7100], 'basavana bagewadi': [16.5755, 75.9766],
  'bagewadi': [16.5755, 75.9766], 'indi': [17.1771, 75.9601],
  'muddebihal': [16.3376, 76.1311], 'sindagi': [17.2903, 76.2422],
  // Taluks — Davangere
  'davangere taluk': [14.4644, 75.9218], 'channagiri': [14.0227, 75.9236],
  'harihar': [14.5173, 75.7206], 'harpanahalli': [14.7858, 75.9840],
  'jagalur': [14.5190, 76.3397], 'nyamti': [14.2710, 76.0760],
  // Taluks — Chitradurga
  'chitradurga taluk': [14.2251, 76.4020], 'challakere': [14.3124, 76.6521],
  'hiriyur': [13.9451, 76.6143], 'holalkere': [14.0452, 76.1855],
  'hosadurga': [13.8059, 76.2803], 'molakalmuru': [14.7143, 76.7500],
  // Taluks — Tumakuru
  'tumakuru taluk': [13.3379, 77.1173], 'chikkanayakanahalli': [13.1319, 76.6357],
  'gubbi': [13.3085, 76.9411], 'koratagere': [13.5230, 77.2363],
  'kunigal': [13.0216, 77.0261], 'madhugiri': [13.6661, 77.2074],
  'pavagada': [14.0981, 77.2765], 'sira': [13.7454, 76.9064],
  'tiptur': [13.2629, 76.4767], 'turuvekere': [13.1645, 76.6734],
  // Taluks — Chikkaballapur
  'chikkaballapur taluk': [13.4355, 77.7315], 'bagepalli': [13.7821, 77.7912],
  'chintamani': [13.4002, 78.0575], 'gauribidanur': [13.6121, 77.5265],
  'gudibanda': [13.9238, 77.9020], 'sidlaghatta': [13.3897, 77.8625],
  // Taluks — Kolar
  'kolar taluk': [13.1360, 78.1294], 'bangarpet': [12.9879, 78.1771],
  'kgf': [12.9578, 78.2695], 'malur': [13.0048, 77.9416],
  'mulbagal': [13.1620, 78.3924], 'srinivaspur': [13.3472, 78.2110],
  // Taluks — Ramanagara
  'ramanagara taluk': [12.7161, 77.2820], 'channapatna': [12.6517, 77.2086],
  'kanakapura': [12.5467, 77.4181], 'magadi': [12.9588, 77.2234],
  // Taluks — Chamarajanagar
  'chamarajanagar taluk': [11.9261, 76.9437], 'gundlupet': [11.8122, 76.6904],
  'kollegal': [12.1584, 77.1099], 'yelandur': [12.0582, 77.0378],
};

// District → Taluk mapping for cascading dropdowns
const DISTRICT_TALUKS: Record<string, { label: string; value: string }[]> = {
  'bengaluru': [
    { label: 'Bengaluru North', value: 'bengaluru north' }, { label: 'Bengaluru South', value: 'bengaluru south' },
    { label: 'Bengaluru East', value: 'bengaluru east' }, { label: 'Anekal', value: 'anekal' },
    { label: 'Yelahanka', value: 'yelahanka' }, { label: 'Dasarahalli', value: 'dasarahalli' },
    { label: 'Bommanahalli', value: 'bommanahalli' }, { label: 'Mahadevapura', value: 'mahadevapura' },
    { label: 'Rajarajeshwari Nagar', value: 'rajarajeshwari nagar' },
  ],
  'bengaluru rural': [
    { label: 'Devanahalli', value: 'devanahalli' }, { label: 'Doddaballapura', value: 'doddaballapura' },
    { label: 'Hosakote', value: 'hosakote' }, { label: 'Nelamangala', value: 'nelamangala' },
  ],
  'mysuru': [
    { label: 'Mysuru', value: 'mysuru taluk' }, { label: 'Nanjangud', value: 'nanjangud' },
    { label: 'Hunsur', value: 'hunsur' }, { label: 'H D Kote', value: 'h d kote' },
    { label: 'Piriyapatna', value: 'piriyapatna' }, { label: 'Krishnarajanagara', value: 'krishnarajanagara' },
    { label: 'T Narasipur', value: 't narasipur' },
  ],
  'mandya': [
    { label: 'Mandya', value: 'mandya taluk' }, { label: 'Maddur', value: 'maddur' },
    { label: 'Malavalli', value: 'malavalli' }, { label: 'Pandavapura', value: 'pandavapura' },
    { label: 'Srirangapatna', value: 'srirangapatna' }, { label: 'Nagamangala', value: 'nagamangala' },
    { label: 'Krishnarajapete', value: 'krishnarajapete' },
  ],
  'hassan': [
    { label: 'Hassan', value: 'hassan taluk' }, { label: 'Arsikere', value: 'arsikere' },
    { label: 'Belur', value: 'belur' }, { label: 'Channarayapatna', value: 'channarayapatna' },
    { label: 'Holenarasipur', value: 'holenarasipur' }, { label: 'Sakleshpur', value: 'sakleshpur' },
    { label: 'Arkalgud', value: 'arkalgud' }, { label: 'Alur', value: 'alur' },
  ],
  'dakshina kannada': [
    { label: 'Mangaluru', value: 'mangaluru taluk' }, { label: 'Bantwal', value: 'bantwal' },
    { label: 'Beltangady', value: 'beltangady' }, { label: 'Puttur', value: 'puttur' },
    { label: 'Sullia', value: 'sullia' }, { label: 'Kadaba', value: 'kadaba' },
  ],
  'udupi': [
    { label: 'Udupi', value: 'udupi taluk' }, { label: 'Kundapur', value: 'kundapur' },
    { label: 'Karkala', value: 'karkala' }, { label: 'Brahmavar', value: 'brahmavar' },
  ],
  'shivamogga': [
    { label: 'Shivamogga', value: 'shivamogga taluk' }, { label: 'Bhadravati', value: 'bhadravati' },
    { label: 'Hosanagara', value: 'hosanagara' }, { label: 'Sagara', value: 'sagara' },
    { label: 'Shikaripura', value: 'shikaripura' }, { label: 'Soraba', value: 'soraba' },
    { label: 'Thirthahalli', value: 'thirthahalli' },
  ],
  'chikkamagaluru': [
    { label: 'Chikkamagaluru', value: 'chikkamagaluru taluk' }, { label: 'Kadur', value: 'kadur' },
    { label: 'Koppa', value: 'koppa' }, { label: 'Mudigere', value: 'mudigere' },
    { label: 'N R Pura', value: 'n r pura' }, { label: 'Sringeri', value: 'sringeri' },
    { label: 'Tarikere', value: 'tarikere' },
  ],
  'kodagu': [
    { label: 'Madikeri', value: 'madikeri taluk' }, { label: 'Virajpet', value: 'virajpet' },
    { label: 'Somwarpet', value: 'somwarpet' },
  ],
  'belagavi': [
    { label: 'Belagavi', value: 'belagavi taluk' }, { label: 'Athani', value: 'athani' },
    { label: 'Bailhongal', value: 'bailhongal' }, { label: 'Chikodi', value: 'chikodi' },
    { label: 'Gokak', value: 'gokak' }, { label: 'Hukkeri', value: 'hukkeri' },
    { label: 'Khanapur', value: 'khanapur' }, { label: 'Raibag', value: 'raibag' },
    { label: 'Nippani', value: 'nippani' }, { label: 'Ramdurg', value: 'ramdurg' },
    { label: 'Savadatti', value: 'savadatti' },
  ],
  'hubballi-dharwad': [
    { label: 'Hubballi', value: 'hubballi' }, { label: 'Dharwad', value: 'dharwad taluk' },
    { label: 'Kalghatgi', value: 'kalghatgi' }, { label: 'Navalgund', value: 'navalgund' },
    { label: 'Kundgol', value: 'kundgol' },
  ],
  'gadag': [
    { label: 'Gadag', value: 'gadag taluk' }, { label: 'Mundargi', value: 'mundargi' },
    { label: 'Nargund', value: 'nargund' }, { label: 'Shirahatti', value: 'shirahatti' },
    { label: 'Ron', value: 'ron' },
  ],
  'haveri': [
    { label: 'Haveri', value: 'haveri taluk' }, { label: 'Byadagi', value: 'byadagi' },
    { label: 'Hanagal', value: 'hanagal' }, { label: 'Hirekerur', value: 'hirekerur' },
    { label: 'Ranebennur', value: 'ranebennur' }, { label: 'Savanur', value: 'savanur' },
    { label: 'Shiggaon', value: 'shiggaon' },
  ],
  'uttara kannada': [
    { label: 'Karwar', value: 'karwar taluk' }, { label: 'Ankola', value: 'ankola' },
    { label: 'Bhatkal', value: 'bhatkal' }, { label: 'Dandeli', value: 'dandeli' },
    { label: 'Honnavar', value: 'honnavar' }, { label: 'Kumta', value: 'kumta' },
    { label: 'Mundgod', value: 'mundgod' }, { label: 'Siddapur', value: 'siddapur' },
    { label: 'Sirsi', value: 'sirsi' }, { label: 'Yellapur', value: 'yellapur' },
  ],
  'kalaburagi': [
    { label: 'Kalaburagi', value: 'kalaburagi taluk' }, { label: 'Afzalpur', value: 'afzalpur' },
    { label: 'Aland', value: 'aland' }, { label: 'Chittapur', value: 'chittapur' },
    { label: 'Chincholi', value: 'chincholi' }, { label: 'Jevargi', value: 'jevargi' },
    { label: 'Sedam', value: 'sedam' },
  ],
  'yadgir': [
    { label: 'Yadgir', value: 'yadgir taluk' }, { label: 'Shahapur', value: 'yadgir' },
    { label: 'Shorapur', value: 'yadgir' },
  ],
  'bidar': [
    { label: 'Bidar', value: 'bidar taluk' }, { label: 'Aurad', value: 'aurad' },
    { label: 'Basavakalyan', value: 'basavakalyan' }, { label: 'Bhalki', value: 'bhalki' },
    { label: 'Humnabad', value: 'humnabad' },
  ],
  'raichur': [
    { label: 'Raichur', value: 'raichur taluk' }, { label: 'Devadurga', value: 'devadurga' },
    { label: 'Lingsugur', value: 'lingsugur' }, { label: 'Manvi', value: 'manvi' },
    { label: 'Sindhanur', value: 'sindhanur' },
  ],
  'koppal': [
    { label: 'Koppal', value: 'koppal taluk' }, { label: 'Gangavathi', value: 'gangavathi' },
    { label: 'Kustagi', value: 'kustagi' }, { label: 'Yelburga', value: 'yelburga' },
  ],
  'ballari': [
    { label: 'Ballari', value: 'ballari taluk' }, { label: 'Hagaribommanahalli', value: 'hagaribommanahalli' },
    { label: 'Hospet', value: 'hospet' }, { label: 'Kudligi', value: 'kudligi' },
    { label: 'Sandur', value: 'sandur' }, { label: 'Siruguppa', value: 'siruguppa' },
  ],
  'vijayanagara': [
    { label: 'Hospet', value: 'hospet' }, { label: 'Ballari', value: 'ballari taluk' },
    { label: 'Sandur', value: 'sandur' }, { label: 'Hagaribommanahalli', value: 'hagaribommanahalli' },
  ],
  'vijayapura': [
    { label: 'Vijayapura', value: 'vijayapura taluk' }, { label: 'Basavana Bagewadi', value: 'bagewadi' },
    { label: 'Indi', value: 'indi' }, { label: 'Muddebihal', value: 'muddebihal' },
    { label: 'Sindagi', value: 'sindagi' },
  ],
  'davangere': [
    { label: 'Davangere', value: 'davangere taluk' }, { label: 'Channagiri', value: 'channagiri' },
    { label: 'Harihar', value: 'harihar' }, { label: 'Harpanahalli', value: 'harpanahalli' },
    { label: 'Jagalur', value: 'jagalur' }, { label: 'Nyamti', value: 'nyamti' },
  ],
  'chitradurga': [
    { label: 'Chitradurga', value: 'chitradurga taluk' }, { label: 'Challakere', value: 'challakere' },
    { label: 'Hiriyur', value: 'hiriyur' }, { label: 'Holalkere', value: 'holalkere' },
    { label: 'Hosadurga', value: 'hosadurga' }, { label: 'Molakalmuru', value: 'molakalmuru' },
  ],
  'tumakuru': [
    { label: 'Tumakuru', value: 'tumakuru taluk' }, { label: 'Chikkanayakanahalli', value: 'chikkanayakanahalli' },
    { label: 'Gubbi', value: 'gubbi' }, { label: 'Koratagere', value: 'koratagere' },
    { label: 'Kunigal', value: 'kunigal' }, { label: 'Madhugiri', value: 'madhugiri' },
    { label: 'Pavagada', value: 'pavagada' }, { label: 'Sira', value: 'sira' },
    { label: 'Tiptur', value: 'tiptur' }, { label: 'Turuvekere', value: 'turuvekere' },
  ],
  'chikkaballapur': [
    { label: 'Chikkaballapur', value: 'chikkaballapur taluk' }, { label: 'Bagepalli', value: 'bagepalli' },
    { label: 'Chintamani', value: 'chintamani' }, { label: 'Gauribidanur', value: 'gauribidanur' },
    { label: 'Gudibanda', value: 'gudibanda' }, { label: 'Sidlaghatta', value: 'sidlaghatta' },
  ],
  'kolar': [
    { label: 'Kolar', value: 'kolar taluk' }, { label: 'Bangarpet', value: 'bangarpet' },
    { label: 'KGF', value: 'kgf' }, { label: 'Malur', value: 'malur' },
    { label: 'Mulbagal', value: 'mulbagal' }, { label: 'Srinivaspur', value: 'srinivaspur' },
  ],
  'ramanagara': [
    { label: 'Ramanagara', value: 'ramanagara taluk' }, { label: 'Channapatna', value: 'channapatna' },
    { label: 'Kanakapura', value: 'kanakapura' }, { label: 'Magadi', value: 'magadi' },
  ],
  'chamarajanagar': [
    { label: 'Chamarajanagar', value: 'chamarajanagar taluk' }, { label: 'Gundlupet', value: 'gundlupet' },
    { label: 'Kollegal', value: 'kollegal' }, { label: 'Yelandur', value: 'yelandur' },
  ],
  'bagalkote': [
    { label: 'Bagalkote', value: 'bagalkote' }, { label: 'Badami', value: 'bagalkote' },
    { label: 'Bilagi', value: 'bagalkote' }, { label: 'Hungund', value: 'bagalkote' },
    { label: 'Jamkhandi', value: 'bagalkote' }, { label: 'Mudhol', value: 'bagalkote' },
  ],
};

function resolveLocationCoords(location: string, district?: string): [number, number] | null {
  const locLower = String(location || '').toLowerCase();
  for (const [key, coords] of Object.entries(KARNATAKA_LOCATION_COORDS)) {
    if (locLower.includes(key)) return coords;
  }
  if (district) {
    const distLower = String(district).toLowerCase();
    for (const [key, coords] of Object.entries(KARNATAKA_LOCATION_COORDS)) {
      if (distLower.includes(key)) return coords;
    }
  }
  return null;
}

// ---------- Custom Marker Icon ----------
const createCustomIcon = (risk: string, layer: string, hasDeployedActions: boolean) => {
  let colorClass = risk === 'Critical' ? 'bg-danger' : risk === 'High' ? 'bg-warning' : 'bg-primary';
  let innerIcon = '';

  if (layer === 'patrol') {
    colorClass = 'bg-cyan-500';
    innerIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H8.3a2 2 0 0 0-1.6.8L4 11l-5.16.86a1 1 0 0 0-.84.99V16h3m14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/></svg>`;
  } else if (layer === 'clusters') {
    colorClass = risk === 'Critical' ? 'bg-purple-600' : 'bg-pink-600';
    innerIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
  }

  const ringColorClass = hasDeployedActions ? 'bg-success' : colorClass;
  const badgeHtml = hasDeployedActions
    ? `<div class="absolute -top-2 -right-2 bg-success text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-black shadow-lg">
         <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
       </div>`
    : '';

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div class="relative flex items-center justify-center group cursor-pointer" style="width: 24px; height: 24px;">
            <div class="absolute w-[60px] h-[60px] rounded-full animate-pulse opacity-40 blur-md ${ringColorClass}" style="left: -18px; top: -18px;"></div>
            <div class="relative z-10 w-6 h-6 rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.8)] ${colorClass} flex items-center justify-center">
              ${innerIcon}
            </div>
            ${badgeHtml}
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Component to recenter the map on layer change
const MapRecenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, ZOOM_LEVEL, { animate: true });
  }, [center, map]);
  return null;
};

import { useDigitalTwinStore, PatrolUnit } from '../store/digitalTwinStore';

const DigitalTwin = () => {
  const [activeLayer, setActiveLayer] = useState<'heat' | 'clusters' | 'patrol'>('heat');
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null);
  const [activeFilters] = useState<string[]>(['Critical', 'High', 'Medium']);
  const [showAddPatrol, setShowAddPatrol] = useState(false);
  const [showAddNetwork, setShowAddNetwork] = useState(false);
  
  const { patrolUnits, criminalNetworks, deployedActions, addPatrolUnit, removePatrolUnit, addCriminalNetwork, removeCriminalNetwork, addDeployedAction } = useDigitalTwinStore();

  // Add Patrol form state
  const [patrolForm, setPatrolForm] = useState({ name: '', district: '', taluk: '', type: 'Patrol Vehicle', status: 'Available' });
  // Add Network form state
  const [networkForm, setNetworkForm] = useState({ name: '', district: '', taluk: '', type: 'Suspect Node', risk: 'High', caseLinkId: '' });

  const { addToast } = useToastStore();
  const { cases } = useCaseStore();
  const { theme } = useThemeStore();

  // ---- Derive Predictive Heatmap from real FIR cases ----
  const heatmapData = useMemo(() => {
    return cases
      .filter(c => c.district || c.location)
      .map((c, idx) => {
        // Prefer Nominatim-geocoded coords stored on the case, else fallback to local lookup
        let resolvedLat: number | null = null;
        let resolvedLng: number | null = null;
        if (c.lat && c.lng) {
          resolvedLat = c.lat;
          resolvedLng = c.lng;
        } else {
          const fallback = resolveLocationCoords(c.location || '', c.district);
          if (fallback) { resolvedLat = fallback[0]; resolvedLng = fallback[1]; }
        }
        if (!resolvedLat || !resolvedLng) return null;
        const offset = idx * 0.0002;
        return {
          id: 1000 + idx,
          name: `FIR: ${c.id} — ${c.location || c.district}`,
          lat: resolvedLat + offset,
          lng: resolvedLng + offset,
          risk: 'Medium',
          type: c.type || 'Unclassified',
          radius: 30,
          cases: 1,
          caseRef: c.id,
          suspect: Array.isArray(c.suspectName) ? c.suspectName.join(', ') : (c.suspectName || 'Unknown'),
          victim: Array.isArray(c.victimName) ? c.victimName.join(', ') : (c.victimName || 'Unknown'),
          prediction: `FIR ${c.id} filed on ${c.date || 'N/A'}. Type: ${c.type || 'Unknown'}. Status: ${c.status || 'Active'}. Suspect: ${Array.isArray(c.suspectName) ? c.suspectName.join(', ') : (c.suspectName || 'Unknown')}.`,
          actions: ['Deploy Rapid Response', 'Initiate Preliminary Investigation', 'Request Forensics'],
        };
      })
      .filter(Boolean) as any[];
  }, [cases]);

  // ---- Derive Criminal Networks from suspects in FIRs + manually added ----
  const clusterData = useMemo(() => {
    const fromFirs = cases
      .filter(c => c.suspectName && c.suspectName !== 'Unknown' && (c.location || c.district))
      .map((c, idx) => {
        let resolvedLat: number | null = null;
        let resolvedLng: number | null = null;
        if (c.lat && c.lng) {
          resolvedLat = c.lat;
          resolvedLng = c.lng;
        } else {
          const fallback = resolveLocationCoords(c.location || '', c.district);
          if (fallback) { resolvedLat = fallback[0]; resolvedLng = fallback[1]; }
        }
        if (!resolvedLat || !resolvedLng) return null;
        const offset = idx * 0.0002;
        return {
          id: 2000 + idx,
          name: `Suspect: ${Array.isArray(c.suspectName) ? c.suspectName.join(', ') : c.suspectName}`,
          lat: resolvedLat + offset,
          lng: resolvedLng + offset,
          risk: 'Medium',
          type: 'Suspect Node',
          radius: 30,
          cases: 1,
          caseRef: c.id,
          suspect: Array.isArray(c.suspectName) ? c.suspectName.join(', ') : c.suspectName,
          prediction: `Linked to FIR: ${c.id}. Crime type: ${c.type || 'Unknown'}. Last known location: ${c.location || c.district}.`,
          actions: ['Issue Lookout Notice', 'Initiate Surveillance', 'Coordinate with Narcotics Bureau'],
        };
      })
      .filter(Boolean) as any[];

    return [...fromFirs, ...criminalNetworks];
  }, [cases, criminalNetworks]);

  // ---- Live Patrol: only from manually added units ----
  const patrolData = useMemo(() => patrolUnits, [patrolUnits]);

  const currentData = useMemo(() => {
    switch (activeLayer) {
      case 'heat': return heatmapData;
      case 'clusters': return clusterData;
      case 'patrol': return patrolData;
      default: return heatmapData;
    }
  }, [activeLayer, heatmapData, clusterData, patrolData]);

  const visibleHotspots = useMemo(() => {
    if (activeLayer === 'patrol') return currentData; // Patrol units always show regardless of threat filter
    return currentData.filter(spot => activeFilters.includes(spot.risk));
  }, [currentData, activeFilters, activeLayer]);

  const handleLayerChange = (layer: 'heat' | 'clusters' | 'patrol') => {
    setActiveLayer(layer);
    setSelectedHotspot(null);
  };

  const handleSpecificAction = (action: string) => {
    if (!selectedHotspot) return;
    const isAlreadyDeployed = deployedActions[selectedHotspot.id]?.includes(action);
    if (isAlreadyDeployed) return;
    addToast(`Executing: "${action}" at ${selectedHotspot.name}`, 'success');
    addDeployedAction(selectedHotspot.id, action);
  };

  const getLayerTitle = () => {
    if (activeLayer === 'heat') return 'FIR Intelligence';
    if (activeLayer === 'clusters') return 'Suspect Profile';
    return 'Unit Status';
  };

  const getPredictionTitle = () => {
    if (activeLayer === 'heat') return 'Case Details';
    if (activeLayer === 'clusters') return 'Link Analysis';
    return 'Current Dispatch';
  };

  // --- Add Patrol Unit ---
  const handleAddPatrol = () => {
    if (!patrolForm.name || !patrolForm.district) {
      addToast('Please fill Unit Name and District.', 'error');
      return;
    }
    // Try taluk first for accuracy, then fall back to district
    const locationKey = patrolForm.taluk || patrolForm.district;
    const coords = resolveLocationCoords(locationKey);
    if (!coords) {
      addToast('Could not resolve location coordinates.', 'error');
      return;
    }
    const displayLocation = patrolForm.taluk
      ? `${patrolForm.taluk.replace(/ taluk$/, '')}, ${patrolForm.district}`
      : patrolForm.district;
    const newUnit: PatrolUnit = {
      id: Date.now(),
      name: patrolForm.name,
      lat: coords[0],
      lng: coords[1],
      location: displayLocation,
      risk: 'Medium',
      type: patrolForm.type,
      radius: 20,
      cases: 0,
      prediction: `${patrolForm.name} is currently patrolling ${displayLocation}. Status: ${patrolForm.status}.`,
      actions: ['Redirect to Hotspot', 'Request Status Update', 'Dispatch Backup'],
    };
    addPatrolUnit(newUnit);
    setPatrolForm({ name: '', district: '', taluk: '', type: 'Patrol Vehicle', status: 'Available' });
    setShowAddPatrol(false);
    addToast(`Patrol unit "${patrolForm.name}" added at ${displayLocation}.`, 'success');
  };

  const handleRemovePatrol = (id: number) => {
    removePatrolUnit(id);
    if (selectedHotspot?.id === id) setSelectedHotspot(null);
    addToast('Patrol unit removed.', 'info');
  };

  // --- Add Criminal Network Node ---
  const handleAddNetwork = () => {
    if (!networkForm.name || !networkForm.district) {
      addToast('Please fill Node Name and District.', 'error');
      return;
    }
    const locationKey = networkForm.taluk || networkForm.district;
    const coords = resolveLocationCoords(locationKey);
    if (!coords) {
      addToast('Could not resolve location coordinates.', 'error');
      return;
    }
    const displayLocation = networkForm.taluk
      ? `${networkForm.taluk.replace(/ taluk$/, '')}, ${networkForm.district}`
      : networkForm.district;
    const linkedCase = cases.find(c => c.id === networkForm.caseLinkId);
    const newNode: any = {
      id: Date.now(),
      name: networkForm.name,
      lat: coords[0],
      lng: coords[1],
      risk: networkForm.risk,
      type: networkForm.type,
      radius: 30,
      cases: linkedCase ? 1 : 0,
      caseRef: networkForm.caseLinkId || null,
      prediction: `Manually added criminal network node at ${displayLocation}.${linkedCase ? ` Linked to FIR: ${networkForm.caseLinkId}.` : ''}`,
      actions: ['Issue Lookout Notice', 'Initiate Surveillance', 'Coordinate with Narcotics Bureau'],
    };
    addCriminalNetwork(newNode);
    setNetworkForm({ name: '', district: '', taluk: '', type: 'Suspect Node', risk: 'High', caseLinkId: '' });
    setShowAddNetwork(false);
    addToast(`Network node "${networkForm.name}" pinned at ${displayLocation}.`, 'success');
  };

  const handleRemoveNetwork = (id: number) => {
    removeCriminalNetwork(id);
    if (selectedHotspot?.id === id) setSelectedHotspot(null);
    addToast('Network node removed.', 'info');
  };


  return (
    <div className="h-full flex flex-col space-y-4 relative">
      <div className="flex justify-between items-center z-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center">
            <Map className="mr-2 text-primary" /> Digital Twin: Karnataka Crime Ecosystem
          </h2>
          <p className="text-sm text-gray-400 mt-1">Real-time predictive GIS mapping driven by filed FIRs and case data</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleLayerChange('heat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${activeLayer === 'heat' ? 'bg-primary text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-black/40 text-gray-400 hover:bg-white/10'}`}
          >
            <Thermometer className="w-4 h-4 mr-2" /> Predictive Heatmap
          </button>
          <button
            onClick={() => handleLayerChange('clusters')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${activeLayer === 'clusters' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'bg-black/40 text-gray-400 hover:bg-white/10'}`}
          >
            <Users className="w-4 h-4 mr-2" /> Criminal Networks
          </button>
          <button
            onClick={() => handleLayerChange('patrol')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${activeLayer === 'patrol' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]' : 'bg-black/40 text-gray-400 hover:bg-white/10'}`}
          >
            <Shield className="w-4 h-4 mr-2" /> Live Patrol Units
          </button>
          {activeLayer === 'patrol' && (
            <button onClick={() => setShowAddPatrol(true)} className="px-3 py-2 rounded-lg text-sm font-medium bg-cyan-600 text-white flex items-center hover:bg-cyan-700 transition-colors">
              <Plus className="w-4 h-4 mr-1" /> Add Unit
            </button>
          )}
          {activeLayer === 'clusters' && (
            <button onClick={() => setShowAddNetwork(true)} className="px-3 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white flex items-center hover:bg-purple-700 transition-colors">
              <Plus className="w-4 h-4 mr-1" /> Add Node
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 glass rounded-xl border border-gray-200 dark:border-white/10 relative overflow-hidden flex bg-gray-100 dark:bg-[#0f172a]">

        {/* Leaflet Map */}
        <div className="absolute inset-0 z-0 map-container-override">
          <style>{`
            .leaflet-container { background: ${theme === 'dark' ? '#0f172a' : '#f3f4f6'} !important; height: 100%; width: 100%; font-family: inherit; }
            .leaflet-bar a { background-color: ${theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'} !important; color: ${theme === 'dark' ? 'white' : 'black'} !important; border: 1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important; }
            .leaflet-bar a:hover { background-color: ${theme === 'dark' ? 'rgba(34, 211, 238, 0.2)' : 'rgba(0, 0, 0, 0.1)'} !important; }
            .leaflet-control-attribution { background: ${theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)'} !important; color: ${theme === 'dark' ? '#888' : '#333'} !important; }
          `}</style>
          <MapContainer center={MAP_CENTER} zoom={ZOOM_LEVEL} zoomControl={true} scrollWheelZoom={true}>
            <MapRecenter center={MAP_CENTER} />
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url={theme === 'dark' ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
            />
            {visibleHotspots.map(spot => {
              const hasActions = deployedActions[spot.id] && deployedActions[spot.id].length > 0;
              return (
                <Marker
                  key={`${activeLayer}-${spot.id}-${hasActions ? 'active' : 'idle'}`}
                  position={[spot.lat, spot.lng]}
                  icon={createCustomIcon(spot.risk, activeLayer, hasActions)}
                  eventHandlers={{ click: () => setSelectedHotspot(spot) }}
                >
                  <Tooltip direction="top" offset={[0, -10]} className="custom-tooltip !bg-white dark:!bg-gray-900 !border-gray-200 dark:!border-gray-700 !text-gray-900 dark:!text-white rounded p-1 shadow-md">
                    {spot.name}
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
        </div>






        {/* Contextual Action Panel */}
        <AnimatePresence>
          {selectedHotspot && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-4 top-4 bottom-4 w-96 bg-white/95 dark:bg-black/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-5 z-[400] flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4 border-b border-gray-200 dark:border-white/10 pb-4">
                <div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded mb-2 inline-block ${selectedHotspot.risk === 'Critical' ? 'bg-danger/20 text-danger' : selectedHotspot.risk === 'High' ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'}`}>
                    {selectedHotspot.risk} Risk Area
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <Crosshair className="w-4 h-4 mr-2 text-primary" /> {selectedHotspot.name}
                  </h3>
                </div>
                <button onClick={() => setSelectedHotspot(null)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xl">✕</button>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">{getLayerTitle()}</h4>
                  <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/5 space-y-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200"><strong>Type:</strong> {selectedHotspot.type}</p>
                    {selectedHotspot.caseRef && <p className="text-sm text-gray-800 dark:text-gray-200"><strong>FIR ID:</strong> {selectedHotspot.caseRef}</p>}
                    {selectedHotspot.suspect && activeLayer !== 'patrol' && <p className="text-sm text-gray-800 dark:text-gray-200"><strong>Suspect:</strong> {selectedHotspot.suspect}</p>}
                    {selectedHotspot.victim && activeLayer === 'heat' && <p className="text-sm text-gray-800 dark:text-gray-200"><strong>Victim:</strong> {selectedHotspot.victim}</p>}
                    <p className="text-sm text-gray-800 dark:text-gray-200"><strong>Active Cases:</strong> {selectedHotspot.cases}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1 text-warning" /> {getPredictionTitle()}
                  </h4>
                  <div className="bg-warning/10 p-3 rounded-lg border border-warning/20 text-warning text-sm">
                    {selectedHotspot.prediction}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Recommended Actions</h4>
                  <ul className="space-y-2">
                    {selectedHotspot.actions.map((action: string, idx: number) => {
                      const isDeployed = deployedActions[selectedHotspot.id]?.includes(action);
                      return (
                        <li
                          key={idx}
                          onClick={() => handleSpecificAction(action)}
                          className={`flex items-center text-sm p-3 rounded border transition-all ${
                            isDeployed
                              ? 'bg-success/20 border-success/50 text-gray-900 dark:text-white cursor-default'
                              : 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 cursor-pointer border-gray-200 dark:border-white/5'
                          }`}
                        >
                          {isDeployed ? <CheckCircle className="w-4 h-4 mr-2 text-success" /> : <Shield className="w-4 h-4 mr-2 text-primary" />}
                          <span className={isDeployed ? 'font-semibold' : ''}>{isDeployed ? `${action} (Deployed)` : action}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              {/* Delete button — only for manually added patrol/network nodes */}
              {(activeLayer === 'patrol' || activeLayer === 'clusters') && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                  <button
                    onClick={() => {
                      if (activeLayer === 'patrol') handleRemovePatrol(selectedHotspot.id);
                      else handleRemoveNetwork(selectedHotspot.id);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 font-semibold py-2.5 rounded-lg transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    {activeLayer === 'patrol' ? 'Remove Patrol Unit' : 'Remove Network Node'}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Patrol Unit Modal */}
        <AnimatePresence>
          {showAddPatrol && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/10 p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900 dark:text-white font-bold text-lg flex items-center"><Shield className="w-5 h-5 mr-2 text-cyan-500" /> Add Patrol Unit</h3>
                  <button onClick={() => setShowAddPatrol(false)}><X className="w-5 h-5 text-gray-500 hover:text-gray-900 dark:hover:text-white" /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Unit Name *</label>
                    <input value={patrolForm.name} onChange={e => setPatrolForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Unit Delta-1" className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">District *</label>
                    <select
                      value={patrolForm.district}
                      onChange={e => setPatrolForm(p => ({ ...p, district: e.target.value, taluk: '' }))}
                      className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                    >
                      <option value="">-- Select District --</option>
                      <option value="bengaluru">Bengaluru</option>
                      <option value="bengaluru rural">Bengaluru Rural</option>
                      <option value="mysuru">Mysuru</option>
                      <option value="hubballi-dharwad">Hubballi-Dharwad</option>
                      <option value="dakshina kannada">Dakshina Kannada (Mangaluru)</option>
                      <option value="belagavi">Belagavi</option>
                      <option value="kalaburagi">Kalaburagi</option>
                      <option value="davangere">Davangere</option>
                      <option value="ballari">Ballari</option>
                      <option value="tumakuru">Tumakuru</option>
                      <option value="shivamogga">Shivamogga</option>
                      <option value="vijayapura">Vijayapura</option>
                      <option value="raichur">Raichur</option>
                      <option value="udupi">Udupi</option>
                      <option value="hassan">Hassan</option>
                      <option value="chikkamagaluru">Chikkamagaluru</option>
                      <option value="kodagu">Kodagu (Coorg)</option>
                      <option value="mandya">Mandya</option>
                      <option value="chamarajanagar">Chamarajanagar</option>
                      <option value="chikkaballapur">Chikkaballapur</option>
                      <option value="chitradurga">Chitradurga</option>
                      <option value="gadag">Gadag</option>
                      <option value="koppal">Koppal</option>
                      <option value="bagalkote">Bagalkote</option>
                      <option value="bidar">Bidar</option>
                      <option value="yadgir">Yadgir</option>
                      <option value="haveri">Haveri</option>
                      <option value="uttara kannada">Uttara Kannada</option>
                      <option value="kolar">Kolar</option>
                      <option value="ramanagara">Ramanagara</option>
                      <option value="vijayanagara">Vijayanagara</option>
                      <option value="dharwad">Dharwad</option>
                    </select>
                  </div>
                  {patrolForm.district && DISTRICT_TALUKS[patrolForm.district] && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Taluk <span className="text-gray-400 normal-case font-normal">(optional – for precise pinning)</span></label>
                      <select
                        value={patrolForm.taluk}
                        onChange={e => setPatrolForm(p => ({ ...p, taluk: e.target.value }))}
                        className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                      >
                        <option value="">-- Select Taluk (uses district center if skipped) --</option>
                        {DISTRICT_TALUKS[patrolForm.district].map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Unit Type</label>
                    <select value={patrolForm.type} onChange={e => setPatrolForm(p => ({ ...p, type: e.target.value }))} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white">
                      <option>Patrol Vehicle</option>
                      <option>Interceptor</option>
                      <option>K9 Unit</option>
                      <option>Forensic Van</option>
                      <option>Rapid Response Team</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Status</label>
                    <select value={patrolForm.status} onChange={e => setPatrolForm(p => ({ ...p, status: e.target.value }))} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white">
                      <option>Available</option>
                      <option>On Duty</option>
                      <option>En Route</option>
                      <option>Standby</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowAddPatrol(false)} className="flex-1 bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white py-2 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-white/20 transition-colors">Cancel</button>
                  <button onClick={handleAddPatrol} className="flex-1 bg-cyan-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-colors">Add Unit</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Criminal Network Node Modal */}
        <AnimatePresence>
          {showAddNetwork && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/10 p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900 dark:text-white font-bold text-lg flex items-center"><Users className="w-5 h-5 mr-2 text-purple-500" /> Add Criminal Network Node</h3>
                  <button onClick={() => setShowAddNetwork(false)}><X className="w-5 h-5 text-gray-500 hover:text-gray-900 dark:hover:text-white" /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Node Name / Suspect *</label>
                    <input value={networkForm.name} onChange={e => setNetworkForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Ravi Kumar (Cartel Leader)" className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Last Known District *</label>
                    <select
                      value={networkForm.district}
                      onChange={e => setNetworkForm(p => ({ ...p, district: e.target.value, taluk: '' }))}
                      className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                    >
                      <option value="">-- Select District --</option>
                      <option value="bengaluru">Bengaluru</option>
                      <option value="bengaluru rural">Bengaluru Rural</option>
                      <option value="mysuru">Mysuru</option>
                      <option value="hubballi-dharwad">Hubballi-Dharwad</option>
                      <option value="dakshina kannada">Dakshina Kannada (Mangaluru)</option>
                      <option value="belagavi">Belagavi</option>
                      <option value="kalaburagi">Kalaburagi</option>
                      <option value="davangere">Davangere</option>
                      <option value="ballari">Ballari</option>
                      <option value="tumakuru">Tumakuru</option>
                      <option value="shivamogga">Shivamogga</option>
                      <option value="vijayapura">Vijayapura</option>
                      <option value="raichur">Raichur</option>
                      <option value="udupi">Udupi</option>
                      <option value="hassan">Hassan</option>
                      <option value="chikkamagaluru">Chikkamagaluru</option>
                      <option value="kodagu">Kodagu (Coorg)</option>
                      <option value="mandya">Mandya</option>
                      <option value="chamarajanagar">Chamarajanagar</option>
                      <option value="chikkaballapur">Chikkaballapur</option>
                      <option value="chitradurga">Chitradurga</option>
                      <option value="gadag">Gadag</option>
                      <option value="koppal">Koppal</option>
                      <option value="bagalkote">Bagalkote</option>
                      <option value="bidar">Bidar</option>
                      <option value="yadgir">Yadgir</option>
                      <option value="haveri">Haveri</option>
                      <option value="uttara kannada">Uttara Kannada</option>
                      <option value="kolar">Kolar</option>
                      <option value="ramanagara">Ramanagara</option>
                      <option value="vijayanagara">Vijayanagara</option>
                      <option value="dharwad">Dharwad</option>
                    </select>
                  </div>
                  {networkForm.district && DISTRICT_TALUKS[networkForm.district] && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Last Known Taluk <span className="text-gray-400 normal-case font-normal">(optional – for precise pinning)</span></label>
                      <select
                        value={networkForm.taluk}
                        onChange={e => setNetworkForm(p => ({ ...p, taluk: e.target.value }))}
                        className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                      >
                        <option value="">-- Select Taluk (uses district center if skipped) --</option>
                        {DISTRICT_TALUKS[networkForm.district].map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Node Type</label>
                    <select value={networkForm.type} onChange={e => setNetworkForm(p => ({ ...p, type: e.target.value }))} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white">
                      <option>Suspect Node</option>
                      <option>Cartel Leader</option>
                      <option>Distributor</option>
                      <option>Money Launderer</option>
                      <option>Informant</option>
                      <option>Safe House</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Link to FIR Case ID (optional)</label>
                    <select value={networkForm.caseLinkId} onChange={e => setNetworkForm(p => ({ ...p, caseLinkId: e.target.value }))} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white">
                      <option value="">-- None --</option>
                      {cases.map(c => <option key={c.id} value={c.id}>{c.id} ({c.type})</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowAddNetwork(false)} className="flex-1 bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white py-2 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-white/20 transition-colors">Cancel</button>
                  <button onClick={handleAddNetwork} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors">Add Node</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default DigitalTwin;
