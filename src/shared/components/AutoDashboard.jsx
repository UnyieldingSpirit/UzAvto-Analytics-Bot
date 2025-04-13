'use client';
import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const AutoAnalytics = () => {
 const [activeMonth, setActiveMonth] = useState('март');
 const [activeSection, setActiveSection] = useState('sales');
 const [activeType, setActiveType] = useState('regions');
 const [selectedItem, setSelectedItem] = useState(null);
 const chartRef = useRef(null);
 
 // Здесь будут находиться моковые данные analyticsData
 const analyticsData = {
   'январь': {
     stats: { 
       newVisitors: { count: 65127, change: '+16.5%', revenue: '55.21 млн' },
       oldVisitors: { count: 984246, change: '-24.9%', revenue: '267.35 млн' },
       accounts: { count: 58400, change: '+14%' },
       bounceRate: { value: '36.7%', change: '+17%' }
     },
     
     sales: {
       regions: [
         { name: "Ташкент", value: 1245, percent: 28.5 },
         { name: "Самарканд", value: 876, percent: 20.1 },
         { name: "Бухара", value: 645, percent: 14.8 },
         { name: "Андижан", value: 567, percent: 13.0 },
         { name: "Фергана", value: 432, percent: 9.9 },
         { name: "Кашкадарья", value: 321, percent: 7.4 },
         { name: "Наманган", value: 285, percent: 6.3 }
       ],
       models: [
         { name: "Chevrolet Nexia", value: 876, change: "+12.3%" },
         { name: "Chevrolet Damas", value: 743, change: "+8.6%" },
         { name: "Chevrolet Cobalt", value: 612, change: "-4.2%" },
         { name: "Ravon R2", value: 534, change: "+15.7%" },
         { name: "UzAuto Spark", value: 423, change: "+10.5%" },
         { name: "Chevrolet Lacetti", value: 398, change: "+5.3%" }
       ],
       modelDetails: {
         "Chevrolet Nexia": {
           "Ташкент": 310,
           "Самарканд": 175,
           "Бухара": 102,
           "Андижан": 88,
           "Фергана": 75,
           "Кашкадарья": 66,
           "Наманган": 60
         },
         "Chevrolet Damas": {
           "Ташкент": 221,
           "Самарканд": 143,
           "Бухара": 105,
           "Андижан": 97,
           "Фергана": 65,
           "Кашкадарья": 65,
           "Наманган": 47
         },
         "Chevrolet Cobalt": {
           "Ташкент": 195,
           "Самарканд": 121,
           "Бухара": 87,
           "Андижан": 76,
           "Фергана": 58,
           "Кашкадарья": 43,
           "Наманган": 32
         },
         "Ravon R2": {
           "Ташкент": 189,
           "Самарканд": 112,
           "Бухара": 78,
           "Андижан": 65,
           "Фергана": 45,
           "Кашкадарья": 28,
           "Наманган": 17
         },
         "UzAuto Spark": {
           "Ташкент": 176,
           "Самарканд": 95,
           "Бухара": 58,
           "Андижан": 47,
           "Фергана": 26,
           "Кашкадарья": 14,
           "Наманган": 7
         },
         "Chevrolet Lacetti": {
           "Ташкент": 154,
           "Самарканд": 85,
           "Бухара": 52,
           "Андижан": 41,
           "Фергана": 32,
           "Кашкадарья": 22,
           "Наманган": 12
         }
       },
       regionDetails: {
         "Ташкент": {
           "Chevrolet Nexia": 310,
           "Chevrolet Damas": 221,
           "Chevrolet Cobalt": 195,
           "Ravon R2": 189,
           "UzAuto Spark": 176,
           "Chevrolet Lacetti": 154
         },
         "Самарканд": {
           "Chevrolet Nexia": 175,
           "Chevrolet Damas": 143,
           "Chevrolet Cobalt": 121,
           "Ravon R2": 112,
           "UzAuto Spark": 95,
           "Chevrolet Lacetti": 85
         },
         "Бухара": {
           "Chevrolet Nexia": 102,
           "Chevrolet Damas": 105,
           "Chevrolet Cobalt": 87,
           "Ravon R2": 78,
           "UzAuto Spark": 58,
           "Chevrolet Lacetti": 52
         },
         "Андижан": {
           "Chevrolet Nexia": 88,
           "Chevrolet Damas": 97,
           "Chevrolet Cobalt": 76,
           "Ravon R2": 65,
           "UzAuto Spark": 47,
           "Chevrolet Lacetti": 41
         },
         "Фергана": {
           "Chevrolet Nexia": 75,
           "Chevrolet Damas": 65,
           "Chevrolet Cobalt": 58,
           "Ravon R2": 45,
           "UzAuto Spark": 26,
           "Chevrolet Lacetti": 32
         },
         "Кашкадарья": {
           "Chevrolet Nexia": 66,
           "Chevrolet Damas": 65,
           "Chevrolet Cobalt": 43,
           "Ravon R2": 28,
           "UzAuto Spark": 14,
           "Chevrolet Lacetti": 22
         },
         "Наманган": {
           "Chevrolet Nexia": 60,
           "Chevrolet Damas": 47,
           "Chevrolet Cobalt": 32,
           "Ravon R2": 17,
           "UzAuto Spark": 7,
           "Chevrolet Lacetti": 12
         }
       }
     },
     
     export: {
       regions: [
         { name: "Казахстан", value: 875, percent: 35.2 },
         { name: "Кыргызстан", value: 645, percent: 26.0 },
         { name: "Таджикистан", value: 421, percent: 17.0 },
         { name: "Россия", value: 320, percent: 12.9 },
         { name: "Афганистан", value: 165, percent: 6.6 },
         { name: "Другие", value: 58, percent: 2.3 }
       ],
       models: [
         { name: "Chevrolet Nexia", value: 456, change: "+18.5%" },
         { name: "Chevrolet Cobalt", value: 387, change: "+22.3%" },
         { name: "Chevrolet Malibu", value: 234, change: "+9.7%" },
         { name: "Ravon R2", value: 210, change: "+5.2%" },
         { name: "Chevrolet Damas", value: 187, change: "+12.1%" },
         { name: "UzAuto Spark", value: 135, change: "+7.8%" }
       ],
       modelDetails: {
         "Chevrolet Nexia": {
           "Казахстан": 172,
           "Кыргызстан": 135,
           "Таджикистан": 65,
           "Россия": 43,
           "Афганистан": 32,
           "Другие": 9
         },
         "Chevrolet Cobalt": {
           "Казахстан": 158,
           "Кыргызстан": 97,
           "Таджикистан": 53,
           "Россия": 38,
           "Афганистан": 29,
           "Другие": 12
         },
         "Chevrolet Malibu": {
           "Казахстан": 98,
           "Кыргызстан": 57,
           "Таджикистан": 31,
           "Россия": 26,
           "Афганистан": 15,
           "Другие": 7
         },
         "Ravon R2": {
           "Казахстан": 86,
           "Кыргызстан": 51,
           "Таджикистан": 28,
           "Россия": 22,
           "Афганистан": 17,
           "Другие": 6
         },
         "Chevrolet Damas": {
           "Казахстан": 78,
           "Кыргызстан": 42,
           "Таджикистан": 25,
           "Россия": 20,
           "Афганистан": 16,
           "Другие": 6
         },
         "UzAuto Spark": {
           "Казахстан": 56,
           "Кыргызстан": 32,
           "Таджикистан": 18,
           "Россия": 15,
           "Афганистан": 10,
           "Другие": 4
         }
       },
       regionDetails: {
         "Казахстан": {
           "Chevrolet Nexia": 172,
           "Chevrolet Cobalt": 158,
           "Chevrolet Malibu": 98,
           "Ravon R2": 86,
           "Chevrolet Damas": 78,
           "UzAuto Spark": 56
         },
         "Кыргызстан": {
           "Chevrolet Nexia": 135,
           "Chevrolet Cobalt": 97,
           "Chevrolet Malibu": 57,
           "Ravon R2": 51,
           "Chevrolet Damas": 42,
           "UzAuto Spark": 32
         },
         "Таджикистан": {
           "Chevrolet Nexia": 65,
           "Chevrolet Cobalt": 53,
           "Chevrolet Malibu": 31,
           "Ravon R2": 28,
           "Chevrolet Damas": 25,
           "UzAuto Spark": 18
         },
         "Россия": {
           "Chevrolet Nexia": 43,
           "Chevrolet Cobalt": 38,
           "Chevrolet Malibu": 26,
           "Ravon R2": 22,
           "Chevrolet Damas": 20,
           "UzAuto Spark": 15
         },
         "Афганистан": {
           "Chevrolet Nexia": 32,
           "Chevrolet Cobalt": 29,
           "Chevrolet Malibu": 15,
           "Ravon R2": 17,
           "Chevrolet Damas": 16,
           "UzAuto Spark": 10
         },
         "Другие": {
           "Chevrolet Nexia": 9,
           "Chevrolet Cobalt": 12,
           "Chevrolet Malibu": 7,
           "Ravon R2": 6,
           "Chevrolet Damas": 6,
           "UzAuto Spark": 4
         }
       }
     },
     
     import: {
       regions: [
         { name: "Корея", value: 940, percent: 38.5 },
         { name: "Россия", value: 645, percent: 26.4 },
         { name: "Китай", value: 432, percent: 17.7 },
         { name: "Германия", value: 240, percent: 9.8 },
         { name: "Турция", value: 102, percent: 4.2 },
         { name: "Другие", value: 84, percent: 3.4 }
       ],
       models: [
         { name: "Запчасти", value: 985, change: "+7.6%" },
         { name: "Комплектующие", value: 754, change: "+12.8%" },
         { name: "Аккумуляторы", value: 423, change: "+3.2%" },
         { name: "Двигатели", value: 325, change: "+9.1%" },
         { name: "Электроника", value: 289, change: "+15.3%" },
         { name: "Материалы", value: 237, change: "+5.7%" }
       ],
       modelDetails: {
         "Запчасти": {
           "Корея": 348,
           "Россия": 195,
           "Китай": 178,
           "Германия": 98,
           "Турция": 42,
           "Другие": 24
         },
         "Комплектующие": {
           "Корея": 246,
           "Россия": 168,
           "Китай": 124,
           "Германия": 65,
           "Турция": 26,
           "Другие": 25
         },
         "Аккумуляторы": {
           "Корея": 112,
           "Россия": 85,
           "Китай": 63,
           "Германия": 32,
           "Турция": 15,
           "Другие": 16
         },
         "Двигатели": {
           "Корея": 98,
           "Россия": 72,
           "Китай": 58,
           "Германия": 42,
           "Турция": 9,
           "Другие": 8
         },
         "Электроника": {
           "Корея": 87,
           "Россия": 65,
           "Китай": 52,
           "Германия": 36,
           "Турция": 6,
           "Другие": 7
         },
         "Материалы": {
           "Корея": 49,
           "Россия": 60,
           "Китай": 41,
           "Германия": 39,
           "Турция": 4,
           "Другие": 4
         }
       },
       regionDetails: {
         "Корея": {
           "Запчасти": 348,
           "Комплектующие": 246,
           "Аккумуляторы": 112,
           "Двигатели": 98,
           "Электроника": 87,
           "Материалы": 49
         },
         "Россия": {
           "Запчасти": 195,
           "Комплектующие": 168,
           "Аккумуляторы": 85,
           "Двигатели": 72,
           "Электроника": 65,
           "Материалы": 60
         },
         "Китай": {
           "Запчасти": 178,
           "Комплектующие": 124,
           "Аккумуляторы": 63,
           "Двигатели": 58,
           "Электроника": 52,
           "Материалы": 41
         },
         "Германия": {
           "Запчасти": 98,
           "Комплектующие": 65,
           "Аккумуляторы": 32,
           "Двигатели": 42,
           "Электроника": 36,
           "Материалы": 39
         },
         "Турция": {
           "Запчасти": 42,
           "Комплектующие": 26,
           "Аккумуляторы": 15,
           "Двигатели": 9,
           "Электроника": 6,
           "Материалы": 4
         },
         "Другие": {
           "Запчасти": 24,
           "Комплектующие": 25,
           "Аккумуляторы": 16,
           "Двигатели": 8,
           "Электроника": 7,
           "Материалы": 4
         }
       }
     }
   },
   
   'февраль': {
     stats: { 
       newVisitors: { count: 72340, change: '+11.1%', revenue: '61.45 млн' },
       oldVisitors: { count: 892450, change: '-9.3%', revenue: '243.76 млн' },
       accounts: { count: 62850, change: '+7.6%' },
       bounceRate: { value: '34.2%', change: '-6.8%' }
     },
     
     sales: {
       regions: [
         { name: "Ташкент", value: 1365, percent: 29.8 },
         { name: "Самарканд", value: 912, percent: 19.9 },
         { name: "Бухара", value: 684, percent: 14.9 },
         { name: "Андижан", value: 592, percent: 12.9 },
         { name: "Фергана", value: 458, percent: 10.0 },
         { name: "Кашкадарья", value: 342, percent: 7.5 },
         { name: "Наманган", value: 302, percent: 6.6 }
       ],
       models: [
         { name: "Chevrolet Nexia", value: 920, change: "+15.3%" },
         { name: "Chevrolet Damas", value: 788, change: "+11.9%" },
         { name: "Chevrolet Cobalt", value: 648, change: "+8.4%" },
         { name: "Ravon R2", value: 564, change: "+17.8%" },
         { name: "UzAuto Spark", value: 445, change: "+12.1%" },
         { name: "Chevrolet Lacetti", value: 412, change: "+6.7%" }
       ],
       modelDetails: {
         "Chevrolet Nexia": {
           "Ташкент": 325,
           "Самарканд": 184,
           "Бухара": 110,
           "Андижан": 94,
           "Фергана": 81,
           "Кашкадарья": 72,
           "Наманган": 64
         },
         "Chevrolet Damas": {
           "Ташкент": 234,
           "Самарканд": 152,
           "Бухара": 113,
           "Андижан": 105,
           "Фергана": 71,
           "Кашкадарья": 69,
           "Наманган": 51
         },
         "Chevrolet Cobalt": {
           "Ташкент": 210,
           "Самарканд": 132,
           "Бухара": 95,
           "Андижан": 84,
           "Фергана": 65,
           "Кашкадарья": 47,
           "Наманган": 37
         },
         "Ravon R2": {
           "Ташкент": 204,
           "Самарканд": 122,
           "Бухара": 86,
           "Андижан": 70,
           "Фергана": 48,
           "Кашкадарья": 31,
           "Наманган": 20
         },
         "UzAuto Spark": {
           "Ташкент": 190,
           "Самарканд": 105,
           "Бухара": 64,
           "Андижан": 52,
           "Фергана": 29,
           "Кашкадарья": 16,
           "Наманган": 9
         },
         "Chevrolet Lacetti": {
           "Ташкент": 168,
           "Самарканд": 95,
           "Бухара": 58,
           "Андижан": 46,
           "Фергана": 36,
           "Кашкадарья": 25,
           "Наманган": 14
         }
       },
       regionDetails: {
         "Ташкент": {
           "Chevrolet Nexia": 325,
           "Chevrolet Damas": 234,
           "Chevrolet Cobalt": 210,
           "Ravon R2": 204,
           "UzAuto Spark": 190,
           "Chevrolet Lacetti": 168
         },
         "Самарканд": {
           "Chevrolet Nexia": 184,
           "Chevrolet Damas": 152,
           "Chevrolet Cobalt": 132,
           "Ravon R2": 122,
           "UzAuto Spark": 105,
           "Chevrolet Lacetti": 95
         },
         "Бухара": {
           "Chevrolet Nexia": 110,
           "Chevrolet Damas": 113,
           "Chevrolet Cobalt": 95,
           "Ravon R2": 86,
           "UzAuto Spark": 64,
           "Chevrolet Lacetti": 58
         },
         "Андижан": {
           "Chevrolet Nexia": 94,
           "Chevrolet Damas": 105,
           "Chevrolet Cobalt": 84,
           "Ravon R2": 70,
           "UzAuto Spark": 52,
           "Chevrolet Lacetti": 46
         },
         "Фергана": {
           "Chevrolet Nexia": 81,
           "Chevrolet Damas": 71,
           "Chevrolet Cobalt": 65,
           "Ravon R2": 48,
           "UzAuto Spark": 29,
           "Chevrolet Lacetti": 36
         },
         "Кашкадарья": {
           "Chevrolet Nexia": 72,
           "Chevrolet Damas": 69,
           "Chevrolet Cobalt": 47,
           "Ravon R2": 31,
           "UzAuto Spark": 16,
           "Chevrolet Lacetti": 25
         },
         "Наманган": {
           "Chevrolet Nexia": 64,
           "Chevrolet Damas": 51,
           "Chevrolet Cobalt": 37,
           "Ravon R2": 20,
           "UzAuto Spark": 9,
           "Chevrolet Lacetti": 14
         }
       }
     },
     
     export: {
       regions: [
         { name: "Казахстан", value: 946, percent: 35.5 },
         { name: "Кыргызстан", value: 678, percent: 25.5 },
         { name: "Таджикистан", value: 458, percent: 17.2 },
         { name: "Россия", value: 354, percent: 13.3 },
         { name: "Афганистан", value: 174, percent: 6.5 },
         { name: "Другие", value: 62, percent: 2.3 }
       ],
       models: [
         { name: "Chevrolet Nexia", value: 487, change: "+18.5%" },
         { name: "Chevrolet Cobalt", value: 414, change: "+22.3%" },
         { name: "Chevrolet Malibu", value: 250, change: "+9.7%" },
         { name: "Ravon R2", value: 224, change: "+5.2%" },
         { name: "Chevrolet Damas", value: 200, change: "+12.1%" },
         { name: "UzAuto Spark", value: 144, change: "+7.8%" }
       ],
       modelDetails: {
         "Chevrolet Nexia": {
           "Казахстан": 184,
           "Кыргызстан": 145,
           "Таджикистан": 71,
           "Россия": 47,
           "Афганистан": 34,
           "Другие": 10
         },
         "Chevrolet Cobalt": {
           "Казахстан": 170,
           "Кыргызстан": 106,
           "Таджикистан": 58,
           "Россия": 41,
           "Афганистан": 32,
           "Другие": 13
         },
         "Chevrolet Malibu": {
           "Казахстан": 106,
           "Кыргызстан": 63,
           "Таджикистан": 34,
           "Россия": 28,
           "Афганистан": 16,
           "Другие": 8
         },
         "Ravon R2": {
           "Казахстан": 94,
           "Кыргызстан": 57,
           "Таджикистан": 31,
           "Россия": 24,
           "Афганистан": 18,
           "Другие": 7
         },
         "Chevrolet Damas": {
           "Казахстан": 84,
           "Кыргызстан": 46,
           "Таджикистан": 28,
           "Россия": 22,
           "Афганистан": 17,
           "Другие": 7
         },
         "UzAuto Spark": {
           "Казахстан": 61,
           "Кыргызстан": 36,
           "Таджикистан": 20,
           "Россия": 17,
           "Афганистан": 11,
           "Другие": 5
         }
       },
       regionDetails: {
         "Казахстан": {
           "Chevrolet Nexia": 184,
           "Chevrolet Cobalt": 170,
           "Chevrolet Malibu": 106,
           "Ravon R2": 94,
           "Chevrolet Damas": 84,
           "UzAuto Spark": 61
         },
         "Кыргызстан": {
           "Chevrolet Nexia": 145,
           "Chevrolet Cobalt": 106,
           "Chevrolet Malibu": 63,
           "Ravon R2": 57,
           "Chevrolet Damas": 46,
           "UzAuto Spark": 36
         },
         "Таджикистан": {
           "Chevrolet Nexia": 71,
           "Chevrolet Cobalt": 58,
           "Chevrolet Malibu": 34,
           "Ravon R2": 31,
           "Chevrolet Damas": 28,
           "UzAuto Spark": 20
         },
         "Россия": {
           "Chevrolet Nexia": 47,
           "Chevrolet Cobalt": 41,
           "Chevrolet Malibu": 28,
           "Ravon R2": 24,
           "Chevrolet Damas": 22,
           "UzAuto Spark": 17
         },
         "Афганистан": {
           "Chevrolet Nexia": 34,
           "Chevrolet Cobalt": 32,
           "Chevrolet Malibu": 16,
           "Ravon R2": 18,
           "Chevrolet Damas": 17,
           "UzAuto Spark": 11
         },
         "Другие": {
           "Chevrolet Nexia": 10,
           "Chevrolet Cobalt": 13,
           "Chevrolet Malibu": 8,
           "Ravon R2": 7,
           "Chevrolet Damas": 7,
           "UzAuto Spark": 5
         }
       }
     },
     
     import: {
       regions: [
         { name: "Корея", value: 1012, percent: 38.4 },
         { name: "Россия", value: 697, percent: 26.5 },
         { name: "Китай", value: 468, percent: 17.8 },
         { name: "Германия", value: 254, percent: 9.6 },
         { name: "Турция", value: 112, percent: 4.3 },
         { name: "Другие", value: 90, percent: 3.4 }
       ],
       models: [
         { name: "Запчасти", value: 1044, change: "+7.6%" },
         { name: "Комплектующие", value: 799, change: "+12.8%" },
         { name: "Аккумуляторы", value: 448, change: "+3.2%" },
         { name: "Двигатели", value: 344, change: "+9.1%" },
         { name: "Электроника", value: 306, change: "+15.3%" },
         { name: "Материалы", value: 251, change: "+5.7%" }
       ],
       modelDetails: {
         "Запчасти": {
           "Корея": 372,
           "Россия": 210,
           "Китай": 192,
           "Германия": 104,
           "Турция": 46,
           "Другие": 26
         },
         "Комплектующие": {
           "Корея": 264,
           "Россия": 182,
           "Китай": 134,
           "Германия": 69,
           "Турция": 28,
           "Другие": 27
         },
         "Аккумуляторы": {
           "Корея": 120,
           "Россия": 92,
           "Китай": 68,
           "Германия": 34,
           "Турция": 16,
           "Другие": 18
         },
         "Двигатели": {
           "Корея": 106,
           "Россия": 78,
           "Китай": 62,
           "Германия": 44,
           "Турция": 10,
           "Другие": 9
         },
         "Электроника": {
           "Корея": 94,
           "Россия": 70,
           "Китай": 56,
           "Германия": 38,
           "Турция": 8,
           "Другие": 8
         },
         "Материалы": {
           "Корея": 56,
           "Россия": 65,
           "Китай": 46,
           "Германия": 42,
           "Турция": 4,
           "Другие": 5
         }
       },
       regionDetails: {
         "Корея": {
           "Запчасти": 372,
           "Комплектующие": 264,
           "Аккумуляторы": 120,
           "Двигатели": 106,
           "Электроника": 94,
           "Материалы": 56
         },
         "Россия": {
           "Запчасти": 210,
           "Комплектующие": 182,
           "Аккумуляторы": 92,
           "Двигатели": 78,
           "Электроника": 70,
           "Материалы": 65
         },
         "Китай": {
           "Запчасти": 192,
           "Комплектующие": 134,
           "Аккумуляторы": 68,
           "Двигатели": 62,
           "Электроника": 56,
           "Материалы": 46
         },
         "Германия": {
           "Запчасти": 104,
           "Комплектующие": 69,
           "Аккумуляторы": 34,
           "Двигатели": 44,
           "Электроника": 38,
           "Материалы": 42
         },
         "Турция": {
           "Запчасти": 46,
           "Комплектующие": 28,
           "Аккумуляторы": 16,
           "Двигатели": 10,
           "Электроника": 8,
           "Материалы": 4
         },
         "Другие": {
           "Запчасти": 26,
           "Комплектующие": 27,
           "Аккумуляторы": 18,
           "Двигатели": 9,
           "Электроника": 8,
           "Материалы": 5
         }
       }
     }
   },
   
   'март': {
     stats: { 
       newVisitors: { count: 81240, change: '+28.3%', revenue: '68.72 млн' },
       oldVisitors: { count: 862540, change: '-12.7%', revenue: '235.89 млн' },
       accounts: { count: 67400, change: '+12.5%' },
       bounceRate: { value: '32.8%', change: '-9.4%' }
     },
     
     sales: {
       regions: [
         { name: "Ташкент", value: 1475, percent: 30.8 },
         { name: "Самарканд", value: 945, percent: 19.7 },
         { name: "Бухара", value: 720, percent: 15.0 },
         { name: "Андижан", value: 615, percent: 12.8 },
         { name: "Фергана", value: 480, percent: 10.0 },
         { name: "Кашкадарья", value: 365, percent: 7.6 },
         { name: "Наманган", value: 325, percent: 6.8 }
       ],
       models: [
         { name: "Chevrolet Nexia", value: 965, change: "+18.2%" },
         { name: "Chevrolet Damas", value: 832, change: "+15.8%" },
         { name: "Chevrolet Cobalt", value: 680, change: "+12.4%" },
         { name: "Ravon R2", value: 590, change: "+19.3%" },
         { name: "UzAuto Spark", value: 465, change: "+13.5%" },
         { name: "Chevrolet Lacetti", value: 430, change: "+8.2%" }
       ],
       modelDetails: {
         "Chevrolet Nexia": {
           "Ташкент": 342,
           "Самарканд": 195,
           "Бухара": 118,
           "Андижан": 103,
           "Фергана": 89,
           "Кашкадарья": 76,
           "Наманган": 68
         },
         "Chevrolet Damas": {
           "Ташкент": 248,
           "Самарканд": 162,
           "Бухара": 124,
           "Андижан": 112,
           "Фергана": 76,
           "Кашкадарья": 72,
           "Наманган": 54
         },
         "Chevrolet Cobalt": {
           "Ташкент": 228,
           "Самарканд": 143,
           "Бухара": 102,
           "Андижан": 92,
           "Фергана": 72,
           "Кашкадарья": 52,
           "Наманган": 42
         },
         "Ravon R2": {
           "Ташкент": 218,
           "Самарканд": 132,
           "Бухара": 92,
           "Андижан": 75,
           "Фергана": 52,
           "Кашкадарья": 36,
           "Наманган": 25
         },
         "UzAuto Spark": {
           "Ташкент": 204,
           "Самарканд": 115,
           "Бухара": 70,
           "Андижан": 58,
           "Фергана": 32,
           "Кашкадарья": 18,
           "Наманган": 12
         },
         "Chevrolet Lacetti": {
           "Ташкент": 185,
           "Самарканд": 103,
           "Бухара": 64,
           "Андижан": 52,
           "Фергана": 42,
           "Кашкадарья": 28,
           "Наманган": 16
         }
       },
       regionDetails: {
         "Ташкент": {
           "Chevrolet Nexia": 342,
           "Chevrolet Damas": 248,
           "Chevrolet Cobalt": 228,
           "Ravon R2": 218,
           "UzAuto Spark": 204,
           "Chevrolet Lacetti": 185
         },
         "Самарканд": {
           "Chevrolet Nexia": 195,
           "Chevrolet Damas": 162,
           "Chevrolet Cobalt": 143,
           "Ravon R2": 132,
           "UzAuto Spark": 115,
           "Chevrolet Lacetti": 103
         },
         "Бухара": {
           "Chevrolet Nexia": 118,
           "Chevrolet Damas": 124,
           "Chevrolet Cobalt": 102,
           "Ravon R2": 92,
           "UzAuto Spark": 70,
           "Chevrolet Lacetti": 64
         },
         "Андижан": {
           "Chevrolet Nexia": 103,
           "Chevrolet Damas": 112,
           "Chevrolet Cobalt": 92,
           "Ravon R2": 75,
           "UzAuto Spark": 58,
           "Chevrolet Lacetti": 52
         },
         "Фергана": {
           "Chevrolet Nexia": 89,
           "Chevrolet Damas": 76,
           "Chevrolet Cobalt": 72,
           "Ravon R2": 52,
           "UzAuto Spark": 32,
           "Chevrolet Lacetti": 42
         },
         "Кашкадарья": {
           "Chevrolet Nexia": 76,
           "Chevrolet Damas": 72,
           "Chevrolet Cobalt": 52,
           "Ravon R2": 36,
           "UzAuto Spark": 18,
           "Chevrolet Lacetti": 28
         },
         "Наманган": {
           "Chevrolet Nexia": 68,
           "Chevrolet Damas": 54,
           "Chevrolet Cobalt": 42,
           "Ravon R2": 25,
           "UzAuto Spark": 12,
           "Chevrolet Lacetti": 16
         }
       }
     },
     
     export: {
       regions: [
         { name: "Казахстан", value: 1012, percent: 35.8 },
         { name: "Кыргызстан", value: 724, percent: 25.6 },
         { name: "Таджикистан", value: 486, percent: 17.2 },
         { name: "Россия", value: 382, percent: 13.5 },
         { name: "Афганистан", value: 185, percent: 6.5 },
         { name: "Другие", value: 68, percent: 2.4 }
       ],
       models: [
         { name: "Chevrolet Nexia", value: 524, change: "+18.5%" },
         { name: "Chevrolet Cobalt", value: 445, change: "+22.3%" },
         { name: "Chevrolet Malibu", value: 269, change: "+9.7%" },
         { name: "Ravon R2", value: 241, change: "+5.2%" },
         { name: "Chevrolet Damas", value: 215, change: "+12.1%" },
         { name: "UzAuto Spark", value: 155, change: "+7.8%" }
       ],
       modelDetails: {
         "Chevrolet Nexia": {
           "Казахстан": 198,
           "Кыргызстан": 156,
           "Таджикистан": 76,
           "Россия": 52,
           "Афганистан": 36,
           "Другие": 12
         },
         "Chevrolet Cobalt": {
           "Казахстан": 184,
           "Кыргызстан": 114,
           "Таджикистан": 62,
           "Россия": 46,
           "Афганистан": 35,
           "Другие": 14
         },
         "Chevrolet Malibu": {
           "Казахстан": 114,
           "Кыргызстан": 68,
           "Таджикистан": 36,
           "Россия": 30,
           "Афганистан": 18,
           "Другие": 9
         },
         "Ravon R2": {
           "Казахстан": 102,
           "Кыргызстан": 62,
           "Таджикистан": 33,
           "Россия": 26,
           "Афганистан": 20,
           "Другие": 8
         },
         "Chevrolet Damas": {
           "Казахстан": 92,
           "Кыргызстан": 50,
           "Таджикистан": 30,
           "Россия": 24,
           "Афганистан": 18,
           "Другие": 8
         },
         "UzAuto Spark": {
           "Казахстан": 68,
           "Кыргызстан": 40,
           "Таджикистан": 22,
           "Россия": 18,
           "Афганистан": 12,
           "Другие": 6
         }
       },
       regionDetails: {
         "Казахстан": {
           "Chevrolet Nexia": 198,
           "Chevrolet Cobalt": 184,
           "Chevrolet Malibu": 114,
           "Ravon R2": 102,
           "Chevrolet Damas": 92,
           "UzAuto Spark": 68
         },
         "Кыргызстан": {
           "Chevrolet Nexia": 156,
           "Chevrolet Cobalt": 114,
           "Chevrolet Malibu": 68,
           "Ravon R2": 62,
           "Chevrolet Damas": 50,
           "UzAuto Spark": 40
         },
         "Таджикистан": {
           "Chevrolet Nexia": 76,
           "Chevrolet Cobalt": 62,
           "Chevrolet Malibu": 36,
           "Ravon R2": 33,
           "Chevrolet Damas": 30,
           "UzAuto Spark": 22
         },
         "Россия": {
           "Chevrolet Nexia": 52,
           "Chevrolet Cobalt": 46,
           "Chevrolet Malibu": 30,
           "Ravon R2": 26,
           "Chevrolet Damas": 24,
           "UzAuto Spark": 18
         },
         "Афганистан": {
           "Chevrolet Nexia": 36,
           "Chevrolet Cobalt": 35,
           "Chevrolet Malibu": 18,
           "Ravon R2": 20,
           "Chevrolet Damas": 18,
           "UzAuto Spark": 12
         },
         "Другие": {
           "Chevrolet Nexia": 12,
           "Chevrolet Cobalt": 14,
           "Chevrolet Malibu": 9,
           "Ravon R2": 8,
           "Chevrolet Damas": 8,
           "UzAuto Spark": 6
         }
       }
     },
     
     import: {
       regions: [
         { name: "Корея", value: 1085, percent: 38.5 },
         { name: "Россия", value: 745, percent: 26.4 },
         { name: "Китай", value: 496, percent: 17.6 },
         { name: "Германия", value: 272, percent: 9.6 },
         { name: "Турция", value: 122, percent: 4.3 },
         { name: "Другие", value: 96, percent: 3.4 }
       ],
       models: [
         { name: "Запчасти", value: 1083, change: "+7.6%" },
         { name: "Комплектующие", value: 829, change: "+12.8%" },
         { name: "Аккумуляторы", value: 465, change: "+3.2%" },
         { name: "Двигатели", value: 357, change: "+9.1%" },
         { name: "Электроника", value: 317, change: "+15.3%" },
         { name: "Материалы", value: 260, change: "+5.7%" }
       ],
       modelDetails: {
         "Запчасти": {
           "Корея": 398,
           "Россия": 226,
           "Китай": 204,
           "Германия": 110,
           "Турция": 48,
           "Другие": 28
         },
         "Комплектующие": {
           "Корея": 284,
           "Россия": 194,
           "Китай": 142,
           "Германия": 72,
           "Турция": 30,
           "Другие": 28
         },
         "Аккумуляторы": {
           "Корея": 128,
           "Россия": 98,
           "Китай": 72,
           "Германия": 36,
           "Турция": 18,
           "Другие": 20
         },
         "Двигатели": {
           "Корея": 112,
           "Россия": 82,
           "Китай": 66,
           "Германия": 46,
           "Турция": 12,
           "Другие": 10
         },
         "Электроника": {
           "Корея": 100,
           "Россия": 74,
           "Китай": 60,
           "Германия": 40,
           "Турция": 9,
           "Другие": 8
         },
         "Материалы": {
           "Корея": 63,
           "Россия": 71,
           "Китай": 52,
           "Германия": 46,
           "Турция": 5,
           "Другие": 6
         }
       },
       regionDetails: {
         "Корея": {
           "Запчасти": 398,
           "Комплектующие": 284,
           "Аккумуляторы": 128,
           "Двигатели": 112,
           "Электроника": 100,
           "Материалы": 63
         },
         "Россия": {
           "Запчасти": 226,
           "Комплектующие": 194,
           "Аккумуляторы": 98,
           "Двигатели": 82,
           "Электроника": 74,
           "Материалы": 71
         },
         "Китай": {
           "Запчасти": 204,
           "Комплектующие": 142,
           "Аккумуляторы": 72,
           "Двигатели": 66,
           "Электроника": 60,
           "Материалы": 52
         },
         "Германия": {
           "Запчасти": 110,
           "Комплектующие": 72,
           "Аккумуляторы": 36,
           "Двигатели": 46,
           "Электроника": 40,
           "Материалы": 46
         },
         "Турция": {
           "Запчасти": 48,
           "Комплектующие": 30,
           "Аккумуляторы": 18,
           "Двигатели": 12,
           "Электроника": 9,
           "Материалы": 5
         },
         "Другие": {
           "Запчасти": 28,
           "Комплектующие": 28,
           "Аккумуляторы": 20,
           "Двигатели": 10,
           "Электроника": 8,
           "Материалы": 6
         }
       }
     }
   }
 };

 useEffect(() => {
   renderChart();
 }, [activeMonth, activeSection, activeType, selectedItem]);
 
 const renderChart = () => {
   if (!chartRef.current) return;
   
   let currentData = [];
   
   // Если выбран конкретный элемент, показываем его детали
   if (selectedItem) {
     if (activeType === 'regions') {
       // Показываем модели для выбранного региона
       const regionDetails = analyticsData[activeMonth][activeSection].regionDetails[selectedItem];
       if (regionDetails) {
         currentData = Object.entries(regionDetails).map(([model, value]) => ({
           name: model,
           value: value,
           percent: ((value / (analyticsData[activeMonth][activeSection].regions.find(r => r.name === selectedItem)?.value || 1)) * 100).toFixed(1)
         }));
       }
     } else {
       // Показываем регионы для выбранной модели
       const modelDetails = analyticsData[activeMonth][activeSection].modelDetails[selectedItem];
       if (modelDetails) {
         currentData = Object.entries(modelDetails).map(([region, value]) => ({
           name: region,
           value: value,
           percent: ((value / (analyticsData[activeMonth][activeSection].models.find(m => m.name === selectedItem)?.value || 1)) * 100).toFixed(1)
         }));
       }
     }
   } else {
     // Стандартный режим - показываем выбранный тип данных
     currentData = analyticsData[activeMonth][activeSection][activeType] || [];
   }
   
   // Проверка, есть ли данные для отображения
   if (!currentData || currentData.length === 0) {
     d3.select(chartRef.current).selectAll("*").remove();
     
     // Добавляем сообщение об отсутствии данных
     d3.select(chartRef.current)
       .append("div")
       .style("width", "100%")
       .style("height", "100%")
       .style("display", "flex")
       .style("align-items", "center")
       .style("justify-content", "center")
       .style("color", "#6b7280")
       .style("font-size", "1rem")
       .text("Нет данных для отображения");
     
     return;
   }
   
   d3.select(chartRef.current).selectAll("*").remove();
   
   const width = chartRef.current.clientWidth;
   const height = 350;
   const margin = { top: 20, right: 130, bottom: 30, left: 120 };
   
   const svg = d3.select(chartRef.current)
     .append("svg")
     .attr("width", width)
     .attr("height", height)
     .attr("viewBox", `0 0 ${width} ${height}`)
     .style("overflow", "visible");
   
   // Сортируем данные
   currentData.sort((a, b) => b.value - a.value);
   
   // Шкалы
   const x = d3.scaleLinear()
     .domain([0, d3.max(currentData, d => d.value) * 1.1])
     .range([margin.left, width - margin.right]);
   
   const y = d3.scaleBand()
     .domain(currentData.map(d => d.name))
     .range([margin.top, height - margin.bottom])
     .padding(0.3);
   
   // Цвета для разделов
   const gradientColors = {
     sales: {start: "#3b82f6", end: "#1d4ed8", accent: "#60a5fa"},
     export: {start: "#10b981", end: "#047857", accent: "#34d399"},
     import: {start: "#f59e0b", end: "#b45309", accent: "#fbbf24"}
   };
   
   // Градиент для полос
   const gradient = svg.append("defs")
     .append("linearGradient")
     .attr("id", "bar-gradient")
     .attr("x1", "0%")
     .attr("y1", "0%")
     .attr("x2", "100%")
     .attr("y2", "0%");
   
   gradient.append("stop")
     .attr("offset", "0%")
     .attr("stop-color", gradientColors[activeSection].start)
     .attr("stop-opacity", 0.9);
   
   gradient.append("stop")
     .attr("offset", "100%")
     .attr("stop-color", gradientColors[activeSection].end)
     .attr("stop-opacity", 0.7);
   
   // Эффект свечения
   svg.append("defs")
     .append("filter")
     .attr("id", "glow")
     .append("feGaussianBlur")
     .attr("stdDeviation", "3.5")
     .attr("result", "coloredBlur");
   
   const feMerge = svg.select("filter")
     .append("feMerge");
     
   feMerge.append("feMergeNode")
     .attr("in", "coloredBlur");
   feMerge.append("feMergeNode")
     .attr("in", "SourceGraphic");
   
   // Оси
   svg.append("g")
     .attr("transform", `translate(${margin.left},0)`)
     .call(d3.axisLeft(y).tickSize(0))
     .call(g => g.select(".domain").remove())
     .call(g => g.selectAll(".tick text")
       .attr("fill", "#e5e7eb")
       .style("font-size", "0.8rem")
       .style("font-weight", "500"));
   
   // Линии сетки
   svg.selectAll(".grid-line")
     .data(currentData)
     .enter()
     .append("line")
     .attr("class", "grid-line")
     .attr("x1", margin.left)
     .attr("x2", width - margin.right)
     .attr("y1", d => y(d.name) + y.bandwidth() / 2)
     .attr("y2", d => y(d.name) + y.bandwidth() / 2)
     .attr("stroke", "#374151")
     .attr("stroke-width", 0.5)
     .attr("stroke-dasharray", "3,3");
   
   // Полосы
   const bars = svg.selectAll(".bar")
     .data(currentData)
     .enter()
     .append("rect")
     .attr("class", "bar")
     .attr("x", margin.left)
     .attr("y", d => y(d.name))
     .attr("width", 0)
     .attr("height", y.bandwidth())
     .attr("rx", 4)
     .attr("fill", "url(#bar-gradient)")
     .attr("opacity", 0.9)
     .style("cursor", "pointer")
     .on("mouseover", function(event, d) {
       d3.select(this)
         .attr("opacity", 1)
         .style("filter", "url(#glow)");
         
       const tooltip = d3.select(chartRef.current).append("div")
         .attr("class", "tooltip")
         .style("position", "absolute")
         .style("left", `${event.pageX - chartRef.current.getBoundingClientRect().left + 10}px`)
         .style("top", `${event.pageY - chartRef.current.getBoundingClientRect().top - 30}px`)
         .style("background", "rgba(0, 0, 0, 0.85)")
         .style("color", "#fff")
         .style("padding", "8px 12px")
         .style("border-radius", "6px")
         .style("font-size", "0.8rem")
         .style("pointer-events", "none")
         .style("z-index", "100")
         .style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.5)")
         .style("border", `1px solid ${gradientColors[activeSection].accent}`)
         .style("opacity", 0)
         .html(`
           <div style="font-weight: bold;">${d.name}</div>
           <div style="margin-top: 4px;">Объем: <strong>${d.value.toLocaleString()}</strong></div>
           ${d.percent ? `<div>Доля: <strong>${d.percent}%</strong></div>` : ''}
           ${d.change ? `<div>Динамика: <strong style="color: ${d.change.includes('+') ? '#34d399' : '#f87171'}">${d.change}</strong></div>` : ''}
           <div style="font-size: 0.7rem; margin-top: 5px; opacity: 0.8;">Нажмите для детализации</div>
         `);
       
       tooltip.transition()
         .duration(200)
         .style("opacity", 1);
     })
     .on("mouseout", function() {
       d3.select(this)
         .attr("opacity", 0.9)
         .style("filter", "none");
         
       d3.select(chartRef.current).selectAll(".tooltip").remove();
     })
     .on("click", function(event, d) {
       // Переключаем детализацию при клике
       if (selectedItem === d.name) {
         setSelectedItem(null); // Если тот же элемент - отключаем детализацию
       } else {
         setSelectedItem(d.name); // Включаем детализацию для выбранного элемента
       }
     });
   
   // Анимация полос
   bars.transition()
     .duration(800)
     .delay((d, i) => i * 50)
     .attr("width", d => x(d.value) - margin.left)
     .ease(d3.easeCubicOut);
   
   // Подписи значений
   svg.selectAll(".value-label")
     .data(currentData)
     .enter()
     .append("text")
     .attr("class", "value-label")
     .attr("x", d => x(d.value) + 10)
     .attr("y", d => y(d.name) + y.bandwidth() / 2)
     .attr("dy", "0.35em")
     .style("font-size", "0.8rem")
     .style("fill", "#f9fafb")
     .style("font-weight", "bold")
     .style("opacity", 0)
     .text(d => d.value.toLocaleString())
     .transition()
     .duration(500)
     .delay((d, i) => i * 50 + 500)
     .style("opacity", 1);
   
   // Проценты или изменения
   svg.selectAll(".percent-label")
     .data(currentData)
     .enter()
     .append("text")
     .attr("class", "percent-label")
     .attr("x", d => x(d.value) + 80)
     .attr("y", d => y(d.name) + y.bandwidth() / 2)
     .attr("dy", "0.35em")
     .style("font-size", "0.8rem")
     .style("fill", d => d.change 
       ? (d.change.includes('+') ? "#34d399" : "#f87171") 
       : gradientColors[activeSection].accent)
     .style("font-weight", d => d.change ? "bold" : "normal")
     .style("opacity", 0)
     .text(d => d.percent ? `${d.percent}%` : d.change)
     .transition()
     .duration(500)
     .delay((d, i) => i * 50 + 800)
     .style("opacity", 1);
 };
 
 const getChangeColorClass = (change) => {
   return change.startsWith('+') ? 'text-green-400' : 'text-red-400';
 };
 
 const getTitle = () => {
   if (selectedItem) {
     if (activeType === 'regions') {
       // Если выбран регион, показываем детализацию по моделям для этого региона
       return `${activeSection === 'sales' ? 'Продажи' : activeSection === 'export' ? 'Экспорт' : 'Импорт'} в регионе "${selectedItem}"`;
     } else {
       // Если выбрана модель, показываем детализацию по регионам для этой модели
       return `${activeSection === 'sales' ? 'Продажи' : activeSection === 'export' ? 'Экспорт' : 'Импорт'} ${selectedItem} по регионам`;
     }
   }
   
   const sectionNames = {
     sales: 'Продажи', 
     export: 'Экспорт', 
     import: 'Импорт'
   };
   
   const typeNames = {
     regions: 'по регионам',
     models: activeSection === 'import' ? 'по категориям' : 'по моделям'
   };
   
   return `${sectionNames[activeSection]} ${typeNames[activeType]}`;
 };
 
 return (
   <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-5 rounded-lg shadow-xl border border-gray-700">
     <h1 className="text-2xl font-bold mb-5 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">АВТОМОБИЛЬНАЯ АНАЛИТИКА УЗБЕКИСТАНА</h1>
     
     {/* Переключатель месяцев */}
     <div className="flex mb-5 bg-gray-800 p-1 rounded-lg inline-block">
       {Object.keys(analyticsData).map(month => (
         <button
           key={month}
           className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
             activeMonth === month 
               ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
               : 'text-gray-300 hover:text-white hover:bg-gray-700'
           }`}
           onClick={() => {
             setActiveMonth(month);
             setSelectedItem(null); // Сбрасываем выбранный элемент при смене месяца
           }}
         >
           {month.toUpperCase()}
         </button>
       ))}
     </div>
     
     {/* Карточки с ключевыми метриками */}
     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
       <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-lg border border-blue-500/20 transform hover:scale-105 transition-transform duration-300">
         <div className="flex items-center mb-2">
           <div className="w-12 h-12 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center mr-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
             </svg>
           </div>
           <div>
             <p className="text-gray-400 text-xs">Новые клиенты</p>
             <p className="text-xl font-bold">{analyticsData[activeMonth].stats.newVisitors.count.toLocaleString()}</p>
             <div className="flex items-center text-xs gap-1">
               <span className={getChangeColorClass(analyticsData[activeMonth].stats.newVisitors.change)}>
                 {analyticsData[activeMonth].stats.newVisitors.change}
               </span>
               <span className="text-gray-400">{analyticsData[activeMonth].stats.newVisitors.revenue}</span>
             </div>
           </div>
         </div>
         <div className="h-1 w-full bg-blue-900 rounded-full overflow-hidden">
           <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse" style={{width: `65%`}}></div>
         </div>
       </div>
       
       <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-lg border border-yellow-500/20 transform hover:scale-105 transition-transform duration-300">
         <div className="flex items-center mb-2">
           <div className="w-12 h-12 rounded-full bg-yellow-500 bg-opacity-20 flex items-center justify-center mr-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
             </svg>
           </div>
           <div>
             <p className="text-gray-400 text-xs">Постоянные клиенты</p>
             <p className="text-xl font-bold">{analyticsData[activeMonth].stats.oldVisitors.count.toLocaleString()}</p>
             <div className="flex items-center text-xs gap-1">
               <span className={getChangeColorClass(analyticsData[activeMonth].stats.oldVisitors.change)}>
                 {analyticsData[activeMonth].stats.oldVisitors.change}
               </span>
               <span className="text-gray-400">{analyticsData[activeMonth].stats.oldVisitors.revenue}</span>
             </div>
           </div>
         </div>
         <div className="h-1 w-full bg-yellow-900 rounded-full overflow-hidden">
           <div className="h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full animate-pulse" style={{width: `75%`}}></div>
         </div>
       </div>
       
       <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-lg border border-purple-500/20 transform hover:scale-105 transition-transform duration-300">
         <div className="flex items-center mb-2">
           <div className="w-12 h-12 rounded-full bg-purple-500 bg-opacity-20 flex items-center justify-center mr-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
             </svg>
           </div>
           <div>
             <p className="text-gray-400 text-xs">Всего аккаунтов</p>
             <p className="text-xl font-bold">{analyticsData[activeMonth].stats.accounts.count.toLocaleString()}</p>
             <div className="text-xs">
               <span className={getChangeColorClass(analyticsData[activeMonth].stats.accounts.change)}>
                 {analyticsData[activeMonth].stats.accounts.change} с прошлого месяца
               </span>
             </div>
           </div>
         </div>
         <div className="h-1 w-full bg-purple-900 rounded-full overflow-hidden">
           <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-pulse" style={{width: `60%`}}></div>
         </div>
       </div>
       
       <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-lg border border-red-500/20 transform hover:scale-105 transition-transform duration-300">
         <div className="flex items-center mb-2">
           <div className="w-12 h-12 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center mr-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           </div>
           <div>
             <p className="text-gray-400 text-xs">Показатель отказов</p>
             <p className="text-xl font-bold">{analyticsData[activeMonth].stats.bounceRate.value}</p>
             <div className="text-xs">
               <span className={getChangeColorClass(analyticsData[activeMonth].stats.bounceRate.change)}>
                 {analyticsData[activeMonth].stats.bounceRate.change} с прошлого месяца
               </span>
             </div>
           </div>
         </div>
         <div className="h-1 w-full bg-red-900 rounded-full overflow-hidden">
           <div className="h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full animate-pulse" style={{width: `35%`}}></div>
         </div>
       </div>
     </div>
     
     {/* Заголовок и секции данных */}
     <h2 className="text-lg font-bold mb-4">Производство, экспорт, импорт - статистика продаж автомобилей</h2>
     
     {/* Переключатель разделов */}
     <div className="flex space-x-2 mb-4">
       <button
         className={`px-4 py-2 rounded transition-all duration-300 ${activeSection === 'sales' 
           ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
           : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
         onClick={() => {
           setActiveSection('sales');
           setSelectedItem(null);
         }}
       >
         Продажи
       </button>
       <button
         className={`px-4 py-2 rounded transition-all duration-300 ${activeSection === 'export' 
           ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
           : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
         onClick={() => {
           setActiveSection('export');
           setSelectedItem(null);
         }}
       >
         Экспорт
       </button>
       <button
         className={`px-4 py-2 rounded transition-all duration-300 ${activeSection === 'import' 
           ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-lg' 
           : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
         onClick={() => {
           setActiveSection('import');
           setSelectedItem(null);
         }}
       >
         Импорт
       </button>
     </div>
     
     Если не выбран конкретный элемент, показываем переключатель типов
     {!selectedItem && (
       <div className="flex space-x-2 mb-4">
         <button
           className={`px-3 py-1 text-sm rounded-full transition-all duration-300 ${activeType === 'regions' 
             ? 'bg-white text-gray-900 font-medium shadow-lg' 
             : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
           onClick={() => setActiveType('regions')}
         >
           По регионам
         </button>
         <button
           className={`px-3 py-1 text-sm rounded-full transition-all duration-300 ${activeType === 'models' 
             ? 'bg-white text-gray-900 font-medium shadow-lg' 
             : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
           onClick={() => setActiveType('models')}
         >
           {activeSection === 'import' ? 'По категориям' : 'По моделям'}
         </button>
       </div>
     )}
     
     {/* Если есть выбранный элемент, показываем кнопку возврата */}
     {selectedItem && (
       <div className="flex mb-4">
         <button
           className="px-3 py-1 text-sm rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 flex items-center"
           onClick={() => setSelectedItem(null)}
         >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
           </svg>
           Назад к общему списку
         </button>
       </div>
     )}
     
     {/* Основной график */}
     <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
       <div className="mb-4 flex justify-between items-center">
         <h3 className="text-lg font-bold">{getTitle()}</h3>
         
         {/* Индикатор интерактивности */}
         <div className="text-xs flex items-center text-gray-400">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           Нажмите на элемент для детализации
         </div>
       </div>
       <div ref={chartRef} className="w-full" style={{ height: '350px' }}></div>
     </div>
     
     {/* Дополнительная информация внизу */}
     {/* <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
       <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg">
         <h4 className="font-medium text-blue-400 mb-2">Производство автомобилей</h4>
         <p className="text-sm text-gray-300">В Узбекистане производится более 250,000 автомобилей ежегодно, в том числе популярные модели Chevrolet Nexia, Spark, Cobalt, Damas.</p>
       </div>
       
       <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg">
         <h4 className="font-medium text-green-400 mb-2">Экспортные рынки</h4>
         <p className="text-sm text-gray-300">Основными рынками экспорта автомобилей являются Казахстан, Кыргызстан, Таджикистан и Россия.</p>
       </div>
       
       <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg">
         <h4 className="font-medium text-yellow-400 mb-2">Прогноз роста</h4>
         <p className="text-sm text-gray-300">Ожидается увеличение объемов производства и экспорта авто на 15-20% в течение ближайших двух лет.</p>
       </div>
     </div> */}
   </div>
 );
};

export default AutoAnalytics;