import React from 'react';
import { IToolbarItem, ToolbarLegend } from './components/toolbar';
import "./tutorial.scss";

interface IProps {
    mainToolbarItems: IToolbarItem[];
    sideEditorToolbar: IToolbarItem[];
}

export class Tutorial extends React.Component<IProps> {
    section(title: string, content: JSX.Element | null, image: string | null = null) {
        return (
            <div className="tutorial-section">
                <header>{title}</header>
                {content}
                {image && <img alt="meaningful text" src={`tutorial/${image}.gif`} />}
            </div>
        )
    }

    textSection(title: string, content: string | JSX.Element | null, image: string | null = null) {
        return this.section(
            title, 
            content ? <p>{content}</p> : null,
            image
            );
    }

    render() {
        const { mainToolbarItems, sideEditorToolbar } = this.props;

        return (
            <div className="tutorial">
                {this.section("Main Toolbar", <ToolbarLegend items={mainToolbarItems} dialogFactory={null} />)}
                {this.section("Side Editor Toolbar", <ToolbarLegend items={sideEditorToolbar} dialogFactory={null} />)}
                {this.textSection("Front view", "Draw front view of car body, then smooth contour", "car_front")}
                {this.textSection("Top view", "Draw top view of car body, then smooth contour", "car_top")}
                {this.textSection("Side view", "Draw side view of car body, then smooth contour", "car_side")}
                {this.textSection("Add wheels", "", "car_wheels")}
                {this.textSection("Front section", "Draw front sections view of car body, then smooth contour", "car_sections")}
                {this.textSection("3D View", "", "car_fly_by")}
          </div>
        )
    }
}