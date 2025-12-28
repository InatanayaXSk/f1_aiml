"""Plotly visualisations and report helpers."""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Iterable, Tuple

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

CIRCUITS_DATA: Dict[str, Dict] = {
    "Monza": {
        "type": "high-speed",
        "track": [(0.0, 0.5), (0.2, 0.3), (0.4, 0.2), (0.5, 0.1), (0.7, 0.1), (0.9, 0.3), (1.0, 0.5), (0.9, 0.7), (0.7, 0.9), (0.5, 0.95), (0.3, 0.8), (0.1, 0.6), (0.0, 0.5)],
        "corners": [
            {"name": "Parabolica", "x": 0.9, "y": 0.2},
            {"name": "Prima Variante", "x": 0.3, "y": 0.4},
            {"name": "Lesmo 1", "x": 0.6, "y": 0.15}
        ],
        "drs": [
            {"x0": 0.4, "x1": 0.8, "y0": 0.1, "y1": 0.12},
            {"x0": 0.95, "x1": 1.0, "y0": 0.4, "y1": 0.6}
        ],
        "zones": [
            {"name": "Parabolica", "x0": 0.85, "x1": 0.95, "y0": 0.1, "y1": 0.3, "impact": "positive"},
            {"name": "Lesmo", "x0": 0.5, "x1": 0.7, "y0": 0.1, "y1": 0.2, "impact": "positive"},
            {"name": "Main Straight", "x0": 0.0, "x1": 0.5, "y0": 0.45, "y1": 0.55, "impact": "positive"},
            {"name": "Back Straight", "x0": 0.9, "x1": 1.0, "y0": 0.2, "y1": 0.8, "impact": "positive"}
        ]
    },
    "Monaco": {
        "type": "high-downforce",
        "track": [(0.0, 0.5), (0.1, 0.3), (0.3, 0.1), (0.5, 0.05), (0.7, 0.1), (0.85, 0.3), (0.9, 0.5), (0.8, 0.7), (0.6, 0.85), (0.4, 0.9), (0.2, 0.8), (0.05, 0.6), (0.0, 0.5)],
        "corners": [
            {"name": "Casino", "x": 0.15, "y": 0.35},
            {"name": "Ste Devote", "x": 0.05, "y": 0.55},
            {"name": "Portier", "x": 0.35, "y": 0.08}
        ],
        "drs": [],
        "zones": [
            {"name": "Hairpin", "x0": 0.85, "x1": 0.95, "y0": 0.4, "y1": 0.6, "impact": "neutral"},
            {"name": "Casino", "x0": 0.1, "x1": 0.2, "y0": 0.3, "y1": 0.4, "impact": "neutral"},
            {"name": "Grand Hotel", "x0": 0.35, "x1": 0.45, "y0": 0.05, "y1": 0.15, "impact": "neutral"}
        ]
    },
    "Silverstone": {
        "type": "mixed",
        "track": [(0.0, 0.5), (0.15, 0.2), (0.35, 0.15), (0.6, 0.2), (0.8, 0.4), (0.85, 0.6), (0.7, 0.8), (0.4, 0.85), (0.2, 0.7), (0.05, 0.6), (0.0, 0.5)],
        "corners": [
            {"name": "Copse", "x": 0.2, "y": 0.25},
            {"name": "Maggots", "x": 0.5, "y": 0.15},
            {"name": "Luffield", "x": 0.75, "y": 0.35}
        ],
        "drs": [
            {"x0": 0.05, "x1": 0.25, "y0": 0.45, "y1": 0.55}
        ],
        "zones": [
            {"name": "Fast Complex", "x0": 0.4, "x1": 0.65, "y0": 0.15, "y1": 0.35, "impact": "positive"},
            {"name": "Luffield", "x0": 0.65, "x1": 0.8, "y0": 0.3, "y1": 0.5, "impact": "negative"},
            {"name": "Stowe", "x0": 0.8, "x1": 0.9, "y0": 0.6, "y1": 0.75, "impact": "neutral"}
        ]
    }
}


def draw_circuit_before_after(circuit: str) -> Tuple[go.Figure, go.Figure]:
    details = CIRCUITS_DATA.get(circuit)
    if details is None:
        raise ValueError(f"Circuit '{circuit}' is not defined in CIRCUITS_DATA")

    track_x, track_y = zip(*details["track"])

    before = go.Figure()
    before.add_trace(go.Scatter(x=track_x, y=track_y, mode="lines", name="Track", line=dict(color="black", width=8)))
    for corner in details["corners"]:
        before.add_annotation(x=corner["x"], y=corner["y"], text=corner["name"], showarrow=True, arrowhead=2)
    for drs in details["drs"]:
        before.add_shape(type="rect", x0=drs["x0"], y0=drs["y0"], x1=drs["x1"], y1=drs["y1"], fillcolor="lightblue", opacity=0.4, line=dict(color="blue", width=2))

    before.update_layout(title=f"{circuit} (Current Regulations)", xaxis=dict(visible=False), yaxis=dict(visible=False), showlegend=False)

    after = go.Figure()
    after.add_trace(go.Scatter(x=track_x, y=track_y, mode="lines", name="Track", line=dict(color="black", width=8)))
    color_map = {"positive": "rgba(0, 200, 0, 0.4)", "neutral": "rgba(255, 200, 0, 0.4)", "negative": "rgba(255, 0, 0, 0.4)"}
    for zone in details["zones"]:
        after.add_shape(type="rect", x0=zone["x0"], y0=zone["y0"], x1=zone["x1"], y1=zone["y1"], fillcolor=color_map.get(zone["impact"], "rgba(150,150,150,0.4)"), opacity=0.6, line=dict(color="gray", width=2))
        after.add_annotation(x=(zone["x0"] + zone["x1"]) / 2, y=(zone["y0"] + zone["y1"]) / 2, text=zone["name"], showarrow=False)

    after.update_layout(title=f"{circuit} (2026 Scenario)", xaxis=dict(visible=False), yaxis=dict(visible=False), showlegend=False)

    return before, after


def create_team_impact_heatmap(results: Dict[str, Dict[str, Dict[str, float]]]) -> go.Figure:
    rows = []
    for race_id, race_data in results.items():
        delta = pd.DataFrame(race_data["2026"]).T["mean"] - pd.DataFrame(race_data["current"]).T["mean"]
        rows.append(delta.rename(race_id))

    if not rows:
        data = pd.DataFrame([{"No Data": 0.0}])
    else:
        data = pd.DataFrame(rows).fillna(0.0)

    fig = px.imshow(data.T, color_continuous_scale="RdYlGn_r", aspect="auto")
    fig.update_layout(title="Team Impact Heatmap (2026 minus Current)")
    return fig


def create_monte_carlo_violins(race_results: Dict[str, Dict[str, Dict[str, float]]]) -> go.Figure:
    current = pd.DataFrame(race_results["current"]).T
    future = pd.DataFrame(race_results["2026"]).T

    fig = go.Figure()
    for driver in current.index:
        fig.add_trace(go.Violin(name=f"{driver} Current", y=np.random.normal(current.loc[driver, "mean"], current.loc[driver, "std"], size=50), side="negative", line_color="blue"))
        fig.add_trace(go.Violin(name=f"{driver} 2026", y=np.random.normal(future.loc[driver, "mean"], future.loc[driver, "std"], size=50), side="positive", line_color="red"))

    fig.update_layout(title="Monte Carlo Distribution Comparison", violinmode="overlay")
    return fig


def create_summary_report(output_dir: Path, mae: float, races_simulated: int) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = output_dir / "summary_report.pdf"

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
    except ImportError:
        fallback = output_dir / "summary_report.md"
        fallback.write_text(
            "# F1 2026 Regulation Impact Summary\n\n"
            f"- Races simulated: {races_simulated}\n"
            f"- Model MAE: {mae:.2f} positions\n"
            "- Visual outputs generated in outputs/ directory\n"
        )
        return fallback

    canvas_obj = canvas.Canvas(str(pdf_path), pagesize=A4)
    width, height = A4

    canvas_obj.setFont("Helvetica-Bold", 16)
    canvas_obj.drawString(40, height - 60, "F1 2026 Regulation Impact Summary")

    canvas_obj.setFont("Helvetica", 12)
    canvas_obj.drawString(40, height - 100, f"Races simulated: {races_simulated}")
    canvas_obj.drawString(40, height - 120, f"Model MAE: {mae:.2f} positions")
    canvas_obj.drawString(40, height - 140, "Key deliverables saved under outputs/ directory")

    canvas_obj.showPage()
    canvas_obj.save()
    return pdf_path


def create_track_regulation_dashboard(results: Dict[str, Dict], track_key: str, event_name: str = "") -> go.Figure:
    """Create interactive dashboard showing 2026 regulation impact for a single track."""
    
    if track_key not in results:
        raise ValueError(f"Track key '{track_key}' not found in results")
    
    race_data = results[track_key]
    current = pd.DataFrame(race_data["current"]).T
    future = pd.DataFrame(race_data["2026"]).T
    
    display_name = event_name or race_data.get("event_name", track_key)
    
    # Calculate position changes
    current["mean_pos"] = current["mean"]
    future["mean_pos"] = future["mean"]
    position_change = current["mean_pos"] - future["mean_pos"]
    
    # Create subplots
    from plotly.subplots import make_subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=(
            "Position Distribution Comparison",
            "Top 3 Probability Change",
            "Position Change (Positive = Improvement)",
            "Uncertainty Comparison (Std Dev)"
        ),
        specs=[[{"type": "violin"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "scatter"}]]
    )
    
    # Subplot 1: Violin plots for position distribution
    drivers = current.index[:10]  # Top 10 drivers
    for i, driver in enumerate(drivers):
        fig.add_trace(go.Violin(
            name=f"{driver[:3]}",
            y=np.random.normal(current.loc[driver, "mean"], current.loc[driver, "std"], 100),
            legendgroup=driver,
            scalegroup="current",
            side="negative",
            line_color="blue",
            fillcolor="rgba(0,0,255,0.3)",
            showlegend=i == 0
        ), row=1, col=1)
        
        fig.add_trace(go.Violin(
            name=f"{driver[:3]} 2026",
            y=np.random.normal(future.loc[driver, "mean"], future.loc[driver, "std"], 100),
            legendgroup=driver,
            scalegroup="future",
            side="positive",
            line_color="red",
            fillcolor="rgba(255,0,0,0.3)",
            showlegend=i == 0
        ), row=1, col=1)
    
    # Subplot 2: Top 3 probability change
    top3_change = future["top3_probability"] - current["top3_probability"]
    colors = ["green" if x > 0 else "red" for x in top3_change.values]
    fig.add_trace(go.Bar(
        x=top3_change.index,
        y=top3_change.values * 100,
        marker_color=colors,
        name="Top 3 Prob Change %",
        showlegend=False
    ), row=1, col=2)
    
    # Subplot 3: Position change bar chart
    colors = ["green" if x > 0 else "red" for x in position_change.values]
    fig.add_trace(go.Bar(
        x=position_change.index,
        y=position_change.values,
        marker_color=colors,
        name="Position Change",
        showlegend=False
    ), row=2, col=1)
    
    # Subplot 4: Uncertainty (std dev) comparison
    fig.add_trace(go.Scatter(
        x=current.index,
        y=current["std"],
        mode="markers+lines",
        name="Current Std",
        marker=dict(color="blue", size=8),
        line=dict(color="blue", dash="solid")
    ), row=2, col=2)
    
    fig.add_trace(go.Scatter(
        x=future.index,
        y=future["std"],
        mode="markers+lines",
        name="2026 Std",
        marker=dict(color="red", size=8),
        line=dict(color="red", dash="dash")
    ), row=2, col=2)
    
    fig.update_layout(
        title=f"📊 {display_name} - 2026 Regulation Impact Dashboard",
        height=800,
        showlegend=True,
        violinmode="overlay"
    )
    
    return fig


def create_factor_impact_by_track_type(circuit_metadata: pd.DataFrame) -> go.Figure:
    """Create bar chart showing 2026 regulation factor impacts by track type."""
    
    # 2026 regulation factors and their expected impact
    factors = {
        "Power Ratio (ERS)": {"high-speed": 0.8, "street": 0.3, "high-downforce": 0.4, "mixed": 0.6},
        "Active Aero": {"high-speed": 0.9, "street": 0.2, "high-downforce": 0.3, "mixed": 0.6},
        "Weight Reduction": {"high-speed": 0.5, "street": 0.6, "high-downforce": 0.7, "mixed": 0.6},
        "Tire Changes": {"high-speed": 0.4, "street": 0.7, "high-downforce": 0.6, "mixed": 0.5},
        "Fuel Efficiency": {"high-speed": 0.7, "street": 0.4, "high-downforce": 0.5, "mixed": 0.5}
    }
    
    track_types = ["high-speed", "street", "high-downforce", "mixed"]
    factor_names = list(factors.keys())
    
    fig = go.Figure()
    
    colors = px.colors.qualitative.Set2
    
    for i, factor in enumerate(factor_names):
        values = [factors[factor].get(tt, 0.5) for tt in track_types]
        fig.add_trace(go.Bar(
            name=factor,
            x=track_types,
            y=values,
            marker_color=colors[i % len(colors)]
        ))
    
    fig.update_layout(
        title="🏎️ 2026 Regulation Factor Impact by Track Type",
        xaxis_title="Track Type",
        yaxis_title="Expected Benefit (0-1)",
        barmode="group",
        height=500,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    
    return fig


def create_position_change_waterfall(results: Dict[str, Dict]) -> go.Figure:
    """Create waterfall chart showing cumulative position changes across races."""
    
    race_keys = sorted(results.keys())
    cumulative_change = 0.0
    waterfall_data = []
    
    for key in race_keys:
        race_data = results[key]
        current = pd.DataFrame(race_data["current"]).T
        future = pd.DataFrame(race_data["2026"]).T
        
        # Average position improvement across all drivers
        avg_change = (current["mean"] - future["mean"]).mean()
        cumulative_change += avg_change
        
        waterfall_data.append({
            "race": race_data.get("event_name", key)[:15],
            "change": avg_change,
            "cumulative": cumulative_change
        })
    
    df = pd.DataFrame(waterfall_data)
    
    colors = ["green" if x > 0 else "red" for x in df["change"]]
    
    fig = go.Figure(go.Waterfall(
        name="Position Change",
        orientation="v",
        measure=["relative"] * len(df),
        x=df["race"],
        textposition="outside",
        text=[f"{x:+.2f}" for x in df["change"]],
        y=df["change"],
        connector={"line": {"color": "rgb(63, 63, 63)"}},
        increasing={"marker": {"color": "green"}},
        decreasing={"marker": {"color": "red"}}
    ))
    
    fig.update_layout(
        title="📈 Cumulative Position Impact Across Season (2026 vs Current)",
        yaxis_title="Position Change (Positive = Faster)",
        height=500,
        showlegend=False
    )
    
    return fig


def create_track_comparison_radar(circuit_metadata: pd.DataFrame) -> go.Figure:
    """Create radar chart comparing track characteristics for regulation impact analysis."""
    
    if circuit_metadata.empty:
        # Use default data
        data = [
            {"circuit": "Monza", "corners": 11, "straight_fraction": 0.74, "overtaking_difficulty": 1, "track_type": "high-speed"},
            {"circuit": "Monaco", "corners": 19, "straight_fraction": 0.25, "overtaking_difficulty": 5, "track_type": "street"},
            {"circuit": "Silverstone", "corners": 18, "straight_fraction": 0.52, "overtaking_difficulty": 2, "track_type": "mixed"},
            {"circuit": "Budapest", "corners": 14, "straight_fraction": 0.34, "overtaking_difficulty": 4, "track_type": "high-downforce"},
            {"circuit": "Spa", "corners": 19, "straight_fraction": 0.57, "overtaking_difficulty": 2, "track_type": "high-speed"}
        ]
        circuit_metadata = pd.DataFrame(data)
    
    categories = ["Corners (norm)", "Straight %", "Overtaking Ease", "2026 Benefit"]
    
    fig = go.Figure()
    
    colors = px.colors.qualitative.Plotly
    
    for i, (_, row) in enumerate(circuit_metadata.head(6).iterrows()):
        circuit_name = row.get("circuit_name", row.get("circuit", f"Track {i}"))
        corners_norm = row.get("corners", 15) / 27  # Normalize to Jeddah max
        straight_frac = row.get("straight_fraction", 0.5)
        overtaking_ease = 1 - (row.get("overtaking_difficulty", 3) / 5)
        
        # Calculate expected 2026 benefit based on track characteristics
        track_type = str(row.get("track_type", "mixed")).lower()
        if "high-speed" in track_type:
            benefit_2026 = 0.85
        elif "street" in track_type:
            benefit_2026 = 0.35
        elif "high-downforce" in track_type or "downforce" in track_type:
            benefit_2026 = 0.4
        else:
            benefit_2026 = 0.6
        
        values = [corners_norm, straight_frac, overtaking_ease, benefit_2026]
        values.append(values[0])  # Close the radar
        
        fig.add_trace(go.Scatterpolar(
            r=values,
            theta=categories + [categories[0]],
            fill="toself",
            name=circuit_name[:12],
            fillcolor=f"rgba({','.join([str(int(c*255)) for c in px.colors.hex_to_rgb(colors[i % len(colors)])])},0.3)",
            line=dict(color=colors[i % len(colors)])
        ))
    
    fig.update_layout(
        title="🎯 Track Characteristics Radar (Impact on 2026 Performance)",
        polar=dict(
            radialaxis=dict(visible=True, range=[0, 1])
        ),
        showlegend=True,
        height=600
    )
    
    return fig


def create_grid_of_track_impacts(results: Dict[str, Dict], max_tracks: int = 12) -> go.Figure:
    """Create grid of small multiples showing position impact per track."""
    
    from plotly.subplots import make_subplots
    
    race_keys = sorted(results.keys())[:max_tracks]
    n_tracks = len(race_keys)
    
    if n_tracks == 0:
        fig = go.Figure()
        fig.add_annotation(text="No data available", xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False)
        return fig
    
    cols = 4
    rows = (n_tracks + cols - 1) // cols
    
    track_names = [results[k].get("event_name", k)[:20] for k in race_keys]
    
    fig = make_subplots(
        rows=rows, cols=cols,
        subplot_titles=track_names,
        horizontal_spacing=0.05,
        vertical_spacing=0.08
    )
    
    for idx, key in enumerate(race_keys):
        row = (idx // cols) + 1
        col = (idx % cols) + 1
        
        race_data = results[key]
        current = pd.DataFrame(race_data["current"]).T
        future = pd.DataFrame(race_data["2026"]).T
        
        position_change = current["mean"] - future["mean"]
        top_drivers = position_change.abs().nlargest(5).index
        
        changes = position_change.loc[top_drivers]
        colors = ["green" if x > 0 else "red" for x in changes.values]
        
        fig.add_trace(go.Bar(
            x=[d[:3] for d in top_drivers],
            y=changes.values,
            marker_color=colors,
            showlegend=False
        ), row=row, col=col)
    
    fig.update_layout(
        title="🗺️ Track-by-Track Position Impact (Top 5 Drivers with Biggest Changes)",
        height=200 * rows + 100,
        showlegend=False
    )
    
    return fig


def create_regulation_impact_summary_chart(results: Dict[str, Dict]) -> go.Figure:
    """Create summary chart showing overall regulation impact statistics."""
    
    all_improvements = []
    all_regressions = []
    track_impacts = []
    
    for key, race_data in results.items():
        current = pd.DataFrame(race_data["current"]).T
        future = pd.DataFrame(race_data["2026"]).T
        
        position_change = current["mean"] - future["mean"]
        
        improvements = (position_change > 0).sum()
        regressions = (position_change < 0).sum()
        avg_impact = position_change.mean()
        
        all_improvements.append(improvements)
        all_regressions.append(regressions)
        track_impacts.append({
            "track": race_data.get("event_name", key)[:15],
            "avg_impact": avg_impact
        })
    
    from plotly.subplots import make_subplots
    
    fig = make_subplots(
        rows=1, cols=2,
        subplot_titles=("Drivers Improved vs Regressed", "Average Impact by Track"),
        specs=[[{"type": "pie"}, {"type": "bar"}]]
    )
    
    # Pie chart
    fig.add_trace(go.Pie(
        labels=["Improved", "Regressed", "Unchanged"],
        values=[sum(all_improvements), sum(all_regressions), len(results) * 20 - sum(all_improvements) - sum(all_regressions)],
        marker=dict(colors=["green", "red", "gray"]),
        hole=0.4
    ), row=1, col=1)
    
    # Bar chart for track impacts
    df = pd.DataFrame(track_impacts).sort_values("avg_impact", ascending=True).head(10)
    colors = ["green" if x > 0 else "red" for x in df["avg_impact"]]
    
    fig.add_trace(go.Bar(
        x=df["avg_impact"],
        y=df["track"],
        orientation="h",
        marker_color=colors,
        showlegend=False
    ), row=1, col=2)
    
    fig.update_layout(
        title="📊 2026 Regulation Impact Summary",
        height=400
    )
    
    return fig


__all__ = [
    "draw_circuit_before_after",
    "create_team_impact_heatmap",
    "create_monte_carlo_violins",
    "create_summary_report",
    "create_track_regulation_dashboard",
    "create_factor_impact_by_track_type",
    "create_position_change_waterfall",
    "create_track_comparison_radar",
    "create_grid_of_track_impacts",
    "create_regulation_impact_summary_chart"
]
