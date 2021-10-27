import React from 'react';
import { IToolbarItem, ToolbarLegend } from './components/toolbar';
import "./tutorial.scss";

interface IProps {
    mainToolbarItems: IToolbarItem[];
}

export class Tutorial extends React.Component<IProps> {
    section(title: string, content: string | JSX.Element | null, image: string | null = null) {
        return (
            <div className="tutorial-section">
                <header>{title}</header>
                {content && <p>{content}</p>}
                {image && <img src={`tutorial/${image}.gif`} />}
            </div>
        )
    }

    render() {
        const { mainToolbarItems } = this.props;

        return (
            <div className="tutorial">
                {this.section("Main Toolbar", <ToolbarLegend items={mainToolbarItems} dialogFactory={null} />)}
                {this.section("Front view", "Draw front view of car body, then smooth contour", "car_front")}
                {this.section("Top view", "Draw top view of car body, then smooth contour", "car_top")}
                {this.section("Side view", "Draw side view of car body, then smooth contour", "car_side")}
                {this.section("Add wheels", "", "car_wheels")}
                {this.section("Front section", "Draw front sections view of car body, then smooth contour", "car_sections")}
                {this.section("3D View", "", "car_fly_by")}
          </div>
        )
    }
}