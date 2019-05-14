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
        //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
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
        if(this.twitch){
            this.twitch.onAuthorized((auth)=>{
				console.log("Authorized");
				var parts=auth.token.split(".");
				var payload=JSON.parse(window.atob(parts[1]));
				console.log('https://api.twitch.tv/kraken/users/' + payload.user_id)
				auth.user_id = payload.user_id
				socket.emit('auth', auth);
				
				


                this.Authentication.setToken(auth.token, auth.userId)
                if(!this.state.finishedLoading){
                    // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.

                    // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
                    this.setState(()=>{
                        return {finishedLoading:true}
                    })
                }
            })

            this.twitch.listen('broadcast',(target,contentType,body)=>{
                this.twitch.rig.log(`New PubSub message!\n${target}\n${contentType}\n${body}`)
                // now that you've got a listener, do something with the result... 

                // do something...

            })

            this.twitch.onVisibilityChanged((isVisible,_c)=>{
                this.visibilityChanged(isVisible)
            })

            this.twitch.onContext((context,delta)=>{
                this.contextUpdate(context,delta)
            })
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
				</div>
            )
        }else{
            return (
                <div className="App">
                </div>
            )
        }

    }
}