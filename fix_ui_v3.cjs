const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                  {!isGif && (
                    <div className="flex items-center gap-2 mb-1 sm:mb-1.5 px-1">
                      <span className="text-xs text-slate-500 font-medium">
                        {msg.sender}
                      </span>
                      {isMe && (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                  {isMe && !isGif && (
                    <div className="flex items-center gap-2 mb-1 sm:mb-1.5 px-1 justify-end w-full">
                       <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                    </div>
                  )}`;

const replacement = `                  <div className={\`flex items-center gap-2 mb-1 sm:mb-1.5 px-1 w-full \${isMe ? 'justify-end' : 'justify-between'}\`}>
                    <span className="text-xs text-slate-500 font-medium">
                      {msg.sender}
                    </span>
                    {isMe && (
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete message"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content);
  console.log("REPLACED!");
} else {
  console.log("NOT FOUND!");
}
