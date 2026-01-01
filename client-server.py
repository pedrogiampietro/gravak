import http.server, ssl
import sys
import urllib.request
import urllib.error
from functools import partial

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP Handler that proxies /api/* requests to the login server"""
    
    def __init__(self, *args, login_server="http://localhost:7171", **kwargs):
        self.login_server = login_server
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        # Proxy /api/* requests to login server
        if self.path.startswith("/api/login"):
            self._proxy_request("GET")
        else:
            super().do_GET()
    
    def do_POST(self):
        # Proxy /api/* requests to login server
        if self.path.startswith("/api/login"):
            self._proxy_request("POST")
        else:
            super().do_POST()
    
    def do_OPTIONS(self):
        # Handle CORS preflight
        if self.path.startswith("/api/"):
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()
        else:
            super().do_OPTIONS()
    
    def _proxy_request(self, method):
        """Proxy the request to the login server"""
        # Remove /api/login prefix and keep query string
        path = self.path.replace("/api/login", "")
        if not path:
            path = "/"
        
        target_url = self.login_server + path
        
        try:
            # Create request
            req = urllib.request.Request(target_url, method=method)
            
            # Forward the request
            with urllib.request.urlopen(req, timeout=10) as response:
                # Send response back to client
                self.send_response(response.status)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Content-Type", response.headers.get("Content-Type", "application/json"))
                self.end_headers()
                self.wfile.write(response.read())
                
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
        except urllib.error.URLError as e:
            self.send_response(503)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(b"Login server unavailable")
        except Exception as e:
            self.send_response(500)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(str(e).encode())


if __name__ == "__main__":

  """
  def __main__
  HTTP(S) Webserver in Python that serves the required assets for the HTML5 Client
  Now with proxy support for /api/* requests to the login server
  """

  # Address where the resources are hosted
  ADDRESS = ("0.0.0.0", 8000)
  LOGIN_SERVER = "http://localhost:1337"

  # Parse input
  if len(sys.argv) == 1:
    argument = "http"
  elif len(sys.argv) == 2:
    argument = sys.argv[1].lower()
  else:
    raise ValueError("Unknown arguments specified")

  # Failed..
  if argument not in ["http", "https"]:
    raise ValueError("Specify either HTTP or HTTPS")

  # Create handler with directory and login server config
  def handler(*args, **kwargs):
    return ProxyHandler(*args, directory="client", login_server=LOGIN_SERVER, **kwargs)
    # return ProxyHandler(*args, directory="client/dist", login_server=LOGIN_SERVER, **kwargs)

  # Create the server
  httpd = http.server.HTTPServer(ADDRESS, handler)

  # Wrap HTTP socket in SSL using specified certfiles
  if argument == "https":
    httpd.socket = ssl.wrap_socket(
      httpd.socket,
      server_side=True,
      certfile="./ssl/localhost.crt",
      keyfile="./ssl/localhost.key",
      ssl_version=ssl.PROTOCOL_TLS
    )

  print("Serving at", ADDRESS)
  print("Proxying /api/* to", LOGIN_SERVER)

  httpd.serve_forever()
