// src/components/DetailsChart.js
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import colors from '../constants/colors';

const screenWidth = Dimensions.get('window').width;

// 1. АДАПТИВНАЯ ШИРИНА ГРАФИКА
// Мы берем ширину экрана и вычитаем отступы контейнера (20+20) и еще немного (40),
// чтобы график не прилипал к краям.
const chartWidth = screenWidth - 120;

export default function DetailsChart({ data, title, color, yAxisSuffix = "" }) {
    const yAxisWidth = 35; // Та самая ширина, которую ты задал в пропе yAxisLabelWidth
    // 2. ГЕОМЕТРИЯ
    // Мы хотим ровно 24 столбца.
    // Пусть отступ между ними (spacing) будет фиксированным (4px), так как он маленький.
    const spacing = 4;
    
    // Мы хотим, чтобы 1-я линия была ровно в начале (0px), а 1-й столбец чуть правее.
    // Пусть этот отступ будет равен половине ширины "часового слота".
    // Это делает дизайн сбалансированным.
    
    // Сначала посчитаем "сырую" ширину слота (столбец + отступ), если бы initialSpacing был 0
    // chartWidth = 24 * (barWidth + spacing) + initialSpacing
    // Это сложное уравнение. Пойдем проще.
    
    // Зададим initialSpacing фиксированно, но адаптивно (например, 5% от ширины)
    const initialSpacing = 15; // Фиксированный отступ от оси Y

    // Теперь считаем, сколько места осталось для 24 столбцов
    const availableWidthForBars = chartWidth - initialSpacing;
    
    // Считаем ширину одного столбца
    // (Доступное место / 24) - отступ справа
    const barWidth = (availableWidthForBars / 24) - spacing;

    // Шаг сетки (6 часов). Это ровно (ширина столбца + отступ) * 6
    const sixHoursStep = (barWidth + spacing) * 6;

    // Максимум + 20%
    const maxValue = Math.ceil(Math.max(...data.map(d => d.value)) * 1.2) || 100;

    return (
        <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{title}</Text>

            <View style={{ width: chartWidth, height: 230 }} pointerEvents='none'>

                {/* --- ЛИНИИ СЕТКИ --- */}
                {/* Линия 0:00 - Приклеена к началу области графика (после цифр оси Y) */}
                <View style={[styles.verticalLine, { left: yAxisWidth + initialSpacing}]} />
                
                {/* Линия 6:00 */}
                <View style={[styles.verticalLine, { left: yAxisWidth + initialSpacing + sixHoursStep * 1 - (spacing / 2) }]} />
                
                {/* Линия 12:00 */}
                <View style={[styles.verticalLine, { left: yAxisWidth + initialSpacing + sixHoursStep * 2 - (spacing / 2) }]} />

                {/* Линия 18:00 */}
                <View style={[styles.verticalLine, { left: yAxisWidth + initialSpacing + sixHoursStep * 3 - (spacing / 2) }]} />

                <View style={[styles.verticalLine, { left: yAxisWidth + initialSpacing + sixHoursStep * 4 - (spacing / 2) }]} />

                

                {/* --- ГРАФИК --- */}
                <BarChart
                    scrollable={false}
                    disablePress={true}
                    data={data}
                    width={chartWidth}
                    height={200}
                    barWidth={barWidth}
                    spacing={spacing}
                    initialSpacing={initialSpacing} // Вот тот самый отступ от первой линии
                    barBorderRadius={2}
                    frontColor={color || colors.primary}
                    
                    hideRules={false}
                    rulesColor="rgba(255, 255, 255, 0.1)"
                    rulesType="solid"
                    rulesThickness={1} // Тонкая линия
                    
                    yAxisThickness={0}
                    xAxisThickness={0}
                    
                    yAxisTextStyle={{ color: '#8E8E93', fontSize: 10 }}
                    // Ширина лейбла оси Y. Важно, чтобы она совпадала с визуальным отступом
                    yAxisLabelWidth={yAxisWidth} 
                    xAxisLabelTextStyle={{ color: '#8E8E93', fontSize: 10, width: 40 }}
                    yAxisLabelSuffix={yAxisSuffix}
                    
                    maxValue={maxValue}
                    noOfSections={4}
                    isAnimated
                    animationDuration={600}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    chartContainer: {
        backgroundColor: '#1C1C1E',
        marginHorizontal: 20,
        borderRadius: 24,
        padding: 20,
        paddingLeft: 10,
        marginBottom: 20,
    },
    chartTitle: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 20,
        paddingLeft: 10,
    },
    verticalLine: {
        position: 'absolute',
        top: 0,
        bottom: 20, // Оставляем место под подписи оси X
        width: 1,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderStyle: 'dashed',
        borderRadius: 1,
        zIndex: 0, 
    }
});