"use client";

import {
    Label,
    PolarGrid,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
} from "recharts";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { calculatePercentage, convertFileSize } from "@/lib/utils";

const chartConfig = {
    size: {
        label: "Size",
    },
    used: {
        label: "Used",
        color: "white",
    },
} satisfies ChartConfig;

export const Chart = ({ used = 0 }: { used: number }) => {
    const chartData = [{ storage: "used", value: used, fill: "white" }];

    // Sweep the arc clockwise from 12 o'clock, a full turn at 100% of the quota.
    // The old form added the raw percentage to the start angle, so a completely
    // full account drew only a 100°-of-360° arc.
    const percentUsed = Math.min(calculatePercentage(used), 100);
    const endAngle = 90 - (percentUsed / 100) * 360;

    return (
        <Card className="chart">
            <CardContent className="flex-1 p-0">
                <ChartContainer config={chartConfig} className="chart-container">
                    <RadialBarChart
                        data={chartData}
                        startAngle={90}
                        endAngle={endAngle}
                        innerRadius={80}
                        outerRadius={110}
                    >
                        <PolarGrid
                            gridType="circle"
                            radialLines={false}
                            stroke="none"
                            className="polar-grid"
                            polarRadius={[86, 74]}
                        />
                        <RadialBar dataKey="value" background cornerRadius={10} />
                        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="chart-total-percentage"
                                                >
                                                    {percentUsed || "0"}
                                                    %
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-white/70"
                                                >
                                                    Space used
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </PolarRadiusAxis>
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
            <CardHeader className="chart-details">
                <CardTitle className="chart-title">Available Storage</CardTitle>
                <CardDescription className="chart-description">
                    {used ? convertFileSize(used) : "2GB"} / 2GB
                </CardDescription>
            </CardHeader>
        </Card>
    );
};