<span data-fragment><div className={"container"} id={`main-${id}`} {...restProps}><Header title={"Welcome"} onClick={() => alert("Clicked!")} />{user.isLoggedIn ? <Profile {...user} showDetails onLogout={handleLogout} /> : <LoginForm onSubmit={e => login(e)} />}{items.length > 0 && <ul>{items.map((item, index) => <li key={item.id || index}><CustomComponent data={item} isActive={selectedItem?.id === item.id} onClick={() => selectItem(item)} /></li>)}</ul>}<footer dangerouslySetInnerHTML={{
      __html: footerHTML
    }} /><svg:foreignObject className={"svg-wrapper"}><p xmlns={"http://www.w3.org/1999/xhtml"}>SVG with XHTML content</p></svg:foreignObject></div><span data-fragment><span>
      Multiline
      
      text content
      
      here.
    </span></span></span>;