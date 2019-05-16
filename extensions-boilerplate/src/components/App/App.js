import React from 'react'
import Authentication from '../../util/Authentication/Authentication'
import { Mmo, socket } from '../Mmo/Mmo';
import { assets } from '../Mmo/Assets';
var config = require('../Mmo/Config');

export default class App extends React.Component{
    constructor(props){
        super(props)
        this.Authentication = new Authentication()
		this.updateSkin = this.updateSkin.bind(this);
        this.twitch = window.Twitch ? window.Twitch.ext : null
        this.state={
            finishedLoading:false,
            theme:'light',
			isVisible:true,
			skin: '',
			skins: {},
			init: false,
			skin_disabled: false
        }
	}
	
	generateSkins(skins) {
		{
			var options = []
			for (let i = 0; i < assets["skins"]["files"].length; i++) {
				options.push(<option key={assets["skins"]["files"][i].name} value={assets["skins"]["files"][i].name}>{assets["skins"]["files"][i].title}</option>)
			}
			return options;
		}
	}
	updateSkin(event) {
		this.setState({skin: event.target.value});
		socket.emit('update', {"skin": event.target.value});
		event.target.blur()
	}	

	updateUsername(event) {
		event.preventDefault();
		event.target.getElementsByTagName("input")[0].blur();
		if(event.target.getElementsByTagName("input")[0].value!="") {
			socket.emit('update', {"name": event.target.getElementsByTagName("input")[0].value});

		}
		event.target.getElementsByTagName("input")[0].value = "";
	}
	sendChat(event) {
		event.preventDefault();
		event.target.getElementsByTagName("input")[0].blur();
		if(event.target.getElementsByTagName("input")[0].value!="") {
			socket.emit('message', event.target.getElementsByTagName("input")[0].value);
		}
		event.target.getElementsByTagName("input")[0].value = "";
		
	}

    contextUpdate(context, delta){
        if(delta.includes('theme')){
            this.setState(()=>{
                return {theme:context.theme}
            })
        }
    }

    visibilityChanged(isVisible){
        this.setState(()=>{
            return {
                isVisible
            }
        })
    }

    componentDidMount(){
		var x = 0,
			y = 0;
        if(this.twitch){
            this.twitch.onAuthorized((auth)=>{
				var parts=auth.token.split(".");
				var payload=JSON.parse(window.atob(parts[1]));
				auth.user_id = payload.user_id
				socket.emit('auth', auth);
				x = this.sizer.clientWidth
				y = this.sizer.clientHeight
				Mmo.init(x,y);

                this.Authentication.setToken(auth.token, auth.userId)
                if(!this.state.finishedLoading){
                    this.setState(()=>{
                        return {finishedLoading:true}
                    })
                }
            })

            this.twitch.listen('broadcast',(target,contentType,body)=>{
                this.twitch.rig.log(`New PubSub message!\n${target}\n${contentType}\n${body}`)

            })

            this.twitch.onVisibilityChanged((isVisible,_c)=>{
				this.visibilityChanged(isVisible);
				console.log(isVisible,_c);
            })

            this.twitch.onContext((context,contextFields)=>{
				this.contextUpdate(context,contextFields)
				console.log(context,contextFields);
				if (contextFields.includes("displayResolution")) {
					var resSplit = context["displayResolution"].split(resSplit),
						resolution = {
							x:parseInt(resSplit[0]),
							y:parseInt(resSplit[1])
						}
					if(resolution["x"]!=x||resolution["y"]!=y){
						x = resolution["x"]
						y = resolution["y"]
						Mmo.resize(x,y);
					}
				}
				/*
					
					var 
				}*/
				
				//this.setState({ elementHeight: this.interface.clientHeight });
            })
		}
		else {
			console.log("== NO TWITCH ==")
			//Mmo.init(this.interface.clientWidth, this.interface.clientHeight);
		}
    }

    componentWillUnmount(){
        if(this.twitch){
            this.twitch.unlisten('broadcast', ()=>console.log('successfully unlistened'))
        }
    }
    
    render(){
        if(this.state.finishedLoading && this.state.isVisible){
            return (
                <div className="interface">
					<div className="status">
						<i className={ this.state.connected ? 'fas fa-link' : 'fas fa-unlink'} ></i>
					</div>
					<div className="menu"
						style={{
							opacity: 1
						}}>
						<div className="menu--group">
							<div className="menu--label">
								character
							</div>
							<div className="skin">
								<select onChange={this.updateSkin} tabIndex={-1} disabled={(this.state.skin_disabled)? "disabled" : ""} onClick={this.enable}>
									{ this.generateSkins(this.state.skins) }
								</select>
							</div>
						</div>
					</div>
					<div className="sizer" ref={element => this.sizer = element}></div>
				</div>
            )
        }else{
            return (
                <div className="interface">
					<div className="sizer" ref={element => this.sizer = element}></div>
                </div>
            )
        }

    }
}