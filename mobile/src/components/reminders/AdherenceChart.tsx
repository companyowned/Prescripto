/**
 * AdherenceChart — Simple bar chart for adherence trends
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendDataPoint } from '../../features/reminders/types';

interface AdherenceChartProps {
    data: TrendDataPoint[];
    height?: number;
}

export const AdherenceChart: React.FC<AdherenceChartProps> = ({
    data,
    height = 140,
}) => {
    if (!data || data.length === 0) {
        return (
            <View style={[styles.container, { height }]}>
                <Text style={styles.emptyText}>No data yet</Text>
            </View>
        );
    }

    const maxBars = Math.min(data.length, 14); // Show last 14 days max
    const displayData = data.slice(-maxBars);
    const barWidth = 100 / maxBars;

    return (
        <View style={styles.wrapper}>
            {/* Y-axis labels */}
            <View style={styles.yAxis}>
                <Text style={styles.yLabel}>100%</Text>
                <Text style={styles.yLabel}>50%</Text>
                <Text style={styles.yLabel}>0%</Text>
            </View>

            {/* Chart area */}
            <View style={[styles.container, { height }]}>
                {/* Grid lines */}
                <View style={[styles.gridLine, { top: 0 }]} />
                <View style={[styles.gridLine, { top: '50%' }]} />
                <View style={[styles.gridLine, { bottom: 0 }]} />

                {/* Bars */}
                <View style={styles.barsContainer}>
                    {displayData.map((point, index) => {
                        const barHeight = Math.max(point.adherence_rate * 100, 2);
                        const color =
                            point.adherence_rate >= 0.8
                                ? '#10B981'
                                : point.adherence_rate >= 0.5
                                    ? '#F59E0B'
                                    : '#EF4444';

                        const dayLabel = new Date(point.date).toLocaleDateString(undefined, {
                            weekday: 'narrow',
                        });

                        return (
                            <View
                                key={point.date}
                                style={[styles.barColumn, { width: `${barWidth}%` }]}
                            >
                                <View style={styles.barWrapper}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: `${barHeight}%`,
                                                backgroundColor: color,
                                            },
                                        ]}
                                    />
                                </View>
                                {index % 2 === 0 && (
                                    <Text style={styles.xLabel}>{dayLabel}</Text>
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
    },
    yAxis: {
        width: 36,
        justifyContent: 'space-between',
        paddingBottom: 16,
    },
    yLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        textAlign: 'right',
        paddingRight: 4,
    },
    container: {
        flex: 1,
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    emptyText: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#F3F4F6',
    },
    barsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        width: '100%',
        height: '100%',
        paddingHorizontal: 2,
    },
    barColumn: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: '100%',
    },
    barWrapper: {
        width: '60%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderRadius: 3,
        minHeight: 2,
    },
    xLabel: {
        fontSize: 9,
        color: '#9CA3AF',
        marginTop: 4,
    },
});
