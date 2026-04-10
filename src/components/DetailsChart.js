// src/components/DetailsChart.js
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useThemeColors } from '../hooks/useThemeColors';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 120;

export default function DetailsChart({ data, title, color, yAxisSuffix = "" }) {
    const colors = useThemeColors();
    
    const yAxisWidth = 35; 
    const spacing = 4;
    const initialSpacing = 15; 
    const availableWidthForBars = chartWidth - initialSpacing;
    const barWidth = (availableWidthForBars / 24) - spacing;
    const sixHoursStep = (barWidth + spacing) * 6;
    const maxValue = Math.ceil(Math.max(...data.map(d => d.value)) * 1.2) || 100;

    return (
        <View style={[styles.chartContainer, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{title}</Text>

            <View style={{ width: chartWidth, height: 230 }} pointerEvents='none'>

                {/* --- ЛИНИИ СЕТКИ --- */}
                {/* Цвет линий сетки делаем на основе colors.border */}
                <View style={[styles.verticalLine, { left: yAxisWidth + initialSpacing, borderColor: colors.border }]} />
                <View style={[styles.verticalLine, { left: yAxisWidth + initialSpacing + sixHoursStep * 1 - (spacing / 2), borderColor: colors.border }]} />
                <View style={[styles.verticalLine, { left: yAxisWidth + initialSpacing + sixHoursStep * 2 - (spacing / 2), borderColor: colors.border }]} />
                <View style={[styles.verticalLine, { left: yAxisWidth + initialSpacing + sixHoursStep * 3 - (spacing / 2), borderColor: colors.border }]} />
                <View style={[styles.verticalLine, { left: yAxisWidth + initialSpacing + sixHoursStep * 4 - (spacing / 2), borderColor: colors.border }]} />

                {/* --- ГРАФИК --- */}
                <BarChart
                    scrollable={false}
                    disablePress={true}
                    data={data}
                    width={chartWidth}
                    height={200}
                    barWidth={barWidth}
                    spacing={spacing}
                    initialSpacing={initialSpacing}
                    barBorderRadius={2}
                    frontColor={color || colors.primary}
                    
                    hideRules={false}
                    rulesColor={colors.border}
                    rulesType="solid"
                    rulesThickness={1}
                    
                    yAxisThickness={0}
                    xAxisThickness={0}
                    
                    yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                    yAxisLabelWidth={yAxisWidth} 
                    xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10, width: 40 }}
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
        marginHorizontal: 20,
        borderRadius: 24,
        padding: 20,
        paddingLeft: 10,
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 18,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 20,
        paddingLeft: 10,
    },
    verticalLine: {
        position: 'absolute',
        top: 0,
        bottom: 20, 
        width: 1,
        borderWidth: 0.5,
        borderStyle: 'dashed',
        borderRadius: 1,
        zIndex: 0, 
    }
});
