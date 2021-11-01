import React from 'react';
import { IToolbarItem, ToolbarLegend } from './components/toolbar';
import "./tutorial.scss";

interface IProps {
    mainToolbarItems: IToolbarItem[];
    sideEditorToolbar: IToolbarItem[];
}

export class Tutorial extends React.Component<IProps> {
    section(title: string, content: JSX.Element | null, image: string | null = null, video: string | null = null) {

        return (
            <div className="tutorial-section">
                <header>{title}</header>
                {content}
                {image && <img alt="meaningful text" src={`tutorial/${image}.gif`} />}
                {video && 
                <div style={{ margin: 20 }}>
                    <div>
                        <a style={{ textDecoration: "none" }} href={`https://youtu.be/${video}`} target="_blank" rel="noopener noreferrer">See on YouTube</a>
                    </div>
                    <embed
                        src={`https://www.youtube.com/embed/${video}`}
                        type="video/mp4"
                        width="800" height="600"
                        title="Keyboard Cat"
                    />
                </div>
                }
            </div>
        )
    }

    textSection(title: string, content: string | JSX.Element | null, image: string | null = null, video: string | null = null) {
        return this.section(
            title, 
            content ? <p>{content}</p> : null,
            image,
            video
            );
    }

    render() {
        const { mainToolbarItems, sideEditorToolbar } = this.props;

        return (
            <div className="tutorial">
                {this.section("Main Toolbar", <ToolbarLegend items={mainToolbarItems} dialogFactory={null} />)}
                {this.section("Side Editor Toolbar", <ToolbarLegend items={sideEditorToolbar} dialogFactory={null} />)}
                {this.textSection("Tutorial", "", null, "JSN41whg0-Q" )}
          </div>
        )
    }
}