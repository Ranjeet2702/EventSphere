// Injects a consistent footer across pages
function createFooter() {
  const year = new Date().getFullYear();
  return `
    <footer class="bg-text text-white py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="md:col-span-2">
            <h3 class="text-2xl font-bold mb-4 gradient-text">EventSphere</h3>
            <p class="text-gray-300 mb-4 max-w-md">
              Your university's premier platform for discovering and participating in campus events. 
              Connect, learn, and grow with your community.
            </p>
            <div class="flex space-x-4">
              <a href="#" class="text-gray-300 hover:text-white transition-colors duration-300">
                <i class="bi bi-facebook text-xl"></i>
              </a>
              <a href="#" class="text-gray-300 hover:text-white transition-colors duration-300">
                <i class="bi bi-twitter text-xl"></i>
              </a>
              <a href="#" class="text-gray-300 hover:text-white transition-colors duration-300">
                <i class="bi bi-instagram text-xl"></i>
              </a>
              <a href="#" class="text-gray-300 hover:text-white transition-colors duration-300">
                <i class="bi bi-linkedin text-xl"></i>
              </a>
            </div>
          </div>

          <div>
            <h4 class="text-lg font-semibold mb-4">Quick Links</h4>
            <ul class="space-y-2">
              <li><a href="login.html" class="text-gray-300 hover:text-white transition-colors duration-300">Login</a></li>
              <li><a href="signup.html" class="text-gray-300 hover:text-white transition-colors duration-300">Sign Up</a></li>
              <li><a href="index.html#events" class="text-gray-300 hover:text-white transition-colors duration-300">Events</a></li>
              <li><a href="about.html" class="text-gray-300 hover:text-white transition-colors duration-300">About Us</a></li>
              <li><a href="team.html" class="text-gray-300 hover:text-white transition-colors duration-300">Our Team</a></li>
              <li><a href="contact.html" class="text-gray-300 hover:text-white transition-colors duration-300">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 class="text-lg font-semibold mb-4">Contact</h4>
            <ul class="space-y-2 text-gray-300">
              <li class="flex items-center">
                <i class="bi bi-envelope mr-2"></i>
                info@eventsphere.edu
              </li>
              <li class="flex items-center">
                <i class="bi bi-telephone mr-2"></i>
                +1 (555) 123-4567
              </li>
              <li class="flex items-center">
                <i class="bi bi-geo-alt mr-2"></i>
                University Campus
              </li>
            </ul>
          </div>
        </div>

        <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; ${year} EventSphere. All rights reserved. | Designed with ❤️ for university communities</p>
        </div>
      </div>
    </footer>
  `;
}

document.addEventListener('DOMContentLoaded', function() {
  const footerContainer = document.getElementById('footer-container');
  if (footerContainer) {
    footerContainer.innerHTML = createFooter();
  }
});


